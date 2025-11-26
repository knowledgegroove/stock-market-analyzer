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
        const eodKey = '69273da55e8d82.29373463'; // User provided key

        // 1. Fetch Quote from EODHD (Primary for Price)
        // Fallback to Finnhub if EODHD fails
        let quote = null;
        try {
            const eodRes = await fetch(
                `https://eodhistoricaldata.com/api/real-time/${symbol}.US?api_token=${eodKey}&fmt=json`
            );
            const eodData = await eodRes.json();
            if (eodData && (eodData.close || eodData.previousClose)) {
                quote = {
                    c: eodData.close,
                    d: eodData.change,
                    dp: eodData.change_p,
                    h: eodData.high,
                    l: eodData.low,
                    o: eodData.open,
                    pc: eodData.previousClose
                };
            }
        } catch (e) {
            console.error('EODHD Quote failed, falling back to Finnhub:', e);
        }

        if (!quote) {
            const quoteRes = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
            );
            quote = await quoteRes.json();
        }

        // 2. Fetch Company Profile from Finnhub (Name, Market Cap)
        const profileRes = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
        );
        const profile = await profileRes.json();

        // 3. Fetch Basic Financials from Finnhub (More reliable than Alpha Vantage free tier)
        const metricsRes = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
        );
        const metricsData = await metricsRes.json();
        const basicMetrics = metricsData.metric || {};
        console.log('Finnhub Metrics Keys:', Object.keys(basicMetrics)); // Debug: Check available keys

        // 4. Fetch Company News from Finnhub (Last 7 days)
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const formatDate = (date) => date.toISOString().split('T')[0];

        const newsRes = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${formatDate(lastWeek)}&to=${formatDate(today)}&token=${apiKey}`
        );
        const newsData = await newsRes.json();

        // 5. Fetch Earnings from Alpha Vantage (Keep for earnings history if possible, or handle gracefully)
        let earnings = [];
        try {
            const avEarningsRes = await fetch(
                `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${alphaKey}`
            );
            const avEarningsData = await avEarningsRes.json();

            if (avEarningsData.quarterlyEarnings) {
                earnings = avEarningsData.quarterlyEarnings.slice(0, 4).map((q, idx) => {
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
            }
        } catch (e) {
            console.error('Alpha Vantage Earnings failed:', e);
        }

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

        console.error('Finnhub Metrics Debug:', JSON.stringify(basicMetrics)); // Use error to ensure visibility

        // Calculate revenue fallback
        let revenue = null;
        if (basicMetrics.revenueTTM) {
            revenue = basicMetrics.revenueTTM * 1000000;
        } else if (basicMetrics.revenuePerShareTTM && profile.shareOutstanding) {
            revenue = basicMetrics.revenuePerShareTTM * profile.shareOutstanding * 1000000;
        } else if (basicMetrics.salesPerShareTTM && profile.shareOutstanding) {
            // salesPerShareTTM is another common key
            revenue = basicMetrics.salesPerShareTTM * profile.shareOutstanding * 1000000;
        }

        // Calculate PEG fallback
        let peg = basicMetrics.pegRatioTTM || null;
        const pe = basicMetrics.peBasicExclExtraTTM || basicMetrics.peTTM;
        const growth = basicMetrics.revenueGrowthQuarterlyYoy || basicMetrics.revenueGrowthTTMYoy || basicMetrics.epsGrowth5Y || basicMetrics.epsGrowth3Y || basicMetrics.epsGrowthTTMYoy;

        if (!peg && pe && growth && growth > 0) {
            // Rough PEG estimation: PE / Growth Rate
            peg = pe / growth;
        }

        return NextResponse.json({
            symbol: symbol,
            companyName: profile.name,
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            marketCap: profile.marketCapitalization * 1000000, // Finnhub gives market cap in millions
            week52High: basicMetrics['52WeekHigh'] || quote.h,
            week52Low: basicMetrics['52WeekLow'] || quote.l,
            news: newsData.slice(0, 5),
            earnings: earnings,
            companyInfo: companyInfo,
            metrics: {
                pe: pe || null,
                peg: peg || null,
                eps: basicMetrics.epsExclExtraItemsTTM || basicMetrics.epsTTM || null,
                revenue: revenue,
                revenueGrowth: growth || null,
                sharesOutstanding: basicMetrics.shareOutstanding || profile.shareOutstanding,
                dividendYield: basicMetrics.dividendYieldIndicatedAnnual || basicMetrics.currentDividendYieldTTM || null,
                beta: basicMetrics.beta || null
            }
        });

    } catch (error) {
        console.error('Finnhub API error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
