import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const apiKey = process.env.STOCK_API_KEY;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!apiKey) {
        console.error('API Key missing');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;

        // 1. Fetch Quote from Finnhub (Price, High, Low)
        const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );
        const quote = await quoteRes.json();

        // 2. Fetch Company Profile from Finnhub (Name, Market Cap)
        const profileRes = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
        );
        const profile = await profileRes.json();

        // 3. Fetch Fundamental Data from Alpha Vantage (Better accuracy for metrics)
        const avOverviewRes = await fetch(
            `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaKey}`
        );
        const avData = await avOverviewRes.json();

        // 4. Fetch Company News from Finnhub (Last 7 days)
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const formatDate = (date) => date.toISOString().split('T')[0];

        const newsRes = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${formatDate(lastWeek)}&to=${formatDate(today)}&token=${apiKey}`
        );
        const newsData = await newsRes.json();

        // 5. Fetch Earnings from Alpha Vantage (More accurate historical data)
        const avEarningsRes = await fetch(
            `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${alphaKey}`
        );
        const avEarningsData = await avEarningsRes.json();

        // Transform Alpha Vantage earnings to match our format
        const earnings = (avEarningsData.quarterlyEarnings || []).slice(0, 4).map((q, idx) => {
            const actual = parseFloat(q.reportedEPS);
            const estimate = parseFloat(q.estimatedEPS);
            const surprise = parseFloat(q.surprise);
            const surprisePercent = parseFloat(q.surprisePercentage);

            // Determine quarter from fiscal date
            const fiscalDate = new Date(q.fiscalDateEnding);
            const month = fiscalDate.getMonth() + 1;
            let quarter = Math.ceil(month / 3);

            return {
                actual: isNaN(actual) ? null : actual,
                estimate: isNaN(estimate) ? null : estimate,
                period: q.reportedDate,
                quarter: quarter,
                surprise: isNaN(surprise) ? (actual && estimate ? actual - estimate : null) : surprise,
                surprisePercent: isNaN(surprisePercent) ? (actual && estimate ? ((actual - estimate) / Math.abs(estimate)) * 100 : null) : surprisePercent,
                symbol: symbol,
                year: fiscalDate.getFullYear()
            };
        });

        // 6. Fetch Company Info from Wikipedia
        let companyInfo = null;
        try {
            // Try with company name variations
            const wikiTitles = [
                profile.name,
                `${profile.name} Inc.`,
                `${profile.name} Corporation`,
                `${profile.name} (company)`
            ];

            for (const title of wikiTitles) {
                const wikiTitle = title.replace(/ /g, '_');
                const wikiRes = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(wikiTitle)}&origin=*`,
                    { headers: { 'User-Agent': 'StockAnalyzer/1.0' } }
                );
                const wikiData = await wikiRes.json();
                const pages = wikiData.query?.pages;

                if (pages) {
                    const pageId = Object.keys(pages)[0];
                    if (pageId !== '-1' && pages[pageId].extract) {
                        companyInfo = pages[pageId].extract;
                        console.log(`Wikipedia data found for: ${title}`);
                        break;
                    }
                }
            }

            if (!companyInfo) {
                console.log(`No Wikipedia data found for: ${profile.name}`);
            }
        } catch (error) {
            console.error('Wikipedia fetch failed:', error);
            // Continue without Wikipedia data
        }

        // Check if we got valid data
        if (!quote || quote.c === 0 || !profile || !profile.name) {
            return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
        }

        return NextResponse.json({
            symbol: symbol,
            companyName: profile.name,
            price: quote.c,
            marketCap: parseFloat(avData.MarketCapitalization) || profile.marketCapitalization * 1000000,
            week52High: parseFloat(avData['52WeekHigh']) || quote.h,
            week52Low: parseFloat(avData['52WeekLow']) || quote.l,
            news: newsData.slice(0, 5),
            earnings: earnings,
            companyInfo: companyInfo,
            metrics: {
                pe: parseFloat(avData.PERatio) || null,
                peg: parseFloat(avData.PEGRatio) || null,
                eps: parseFloat(avData.EPS) || null,
                revenue: parseFloat(avData.RevenueTTM) || null,
                revenueGrowth: parseFloat(avData.QuarterlyRevenueGrowthYOY) * 100 || null,
                sharesOutstanding: parseFloat(avData.SharesOutstanding) / 1000000 || profile.shareOutstanding,
                dividendYield: parseFloat(avData.DividendYield) * 100 || null,
                beta: parseFloat(avData.Beta) || null
            }
        });

    } catch (error) {
        console.error('Finnhub API error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
