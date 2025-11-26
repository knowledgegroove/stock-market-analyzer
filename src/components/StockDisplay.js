"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './StockDisplay.module.css';
import StockChart from './StockChart';
import FinancialMetrics from './FinancialMetrics';
import EarningsSection from './EarningsSection';
import NewsSummary from './NewsSummary';
import AIPredictionPanel from './AIPredictionPanel';


export default function StockDisplay({ data, onAddToWatchlist, isInWatchlist }) {
    const [showTrends, setShowTrends] = useState(false);
    const [showCompanyInfo, setShowCompanyInfo] = useState(false);
    const [showPrediction, setShowPrediction] = useState(false);
    const [wikiData, setWikiData] = useState(null);
    const predictionRef = useRef(null);

    useEffect(() => {
        if (showPrediction && predictionRef.current) {
            predictionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showPrediction]);

    // Fetch Wikipedia data when company info is opened
    useEffect(() => {
        if (!showCompanyInfo || wikiData) return; // Don't fetch if not showing or already have data

        const fetchWikiData = async () => {
            try {
                console.log('Fetching Wikipedia data for:', data.companyName);

                // Remove common suffixes to get base name
                const baseName = data.companyName
                    .replace(/ Inc\.?$/i, '')
                    .replace(/ Corporation$/i, '')
                    .replace(/ Corp\.?$/i, '')
                    .replace(/ Ltd\.?$/i, '')
                    .replace(/ Limited$/i, '')
                    .replace(/ Co\.?$/i, '')
                    .replace(/ Company$/i, '')
                    .replace(/\.com$/i, '');

                // Comprehensive list of title variations to try
                const wikiTitles = [
                    `${baseName}, Inc.`,                // "Tesla, Inc."
                    `${baseName} Inc.`,                 // "Apple Inc."
                    `${baseName} Inc`,                  // "Apple Inc" (no period)
                    data.companyName,                   // Original name
                    `${baseName} Corporation`,          // "NVIDIA Corporation"
                    `${baseName} (company)`,            // "Apple (company)"
                    `${data.companyName} (company)`,    // "Apple Inc (company)"
                    baseName                            // "Apple" - last resort
                ];

                let foundData = false;
                for (const title of wikiTitles) {
                    try {
                        const wikiTitle = title.replace(/ /g, '_');
                        const response = await fetch(
                            `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(wikiTitle)}&origin=*`
                        );
                        const wikiJson = await response.json();
                        const pages = wikiJson.query?.pages;

                        if (pages) {
                            const pageId = Object.keys(pages)[0];
                            if (pageId !== '-1' && pages[pageId].extract) {
                                const extract = pages[pageId].extract;

                                // Skip disambiguation pages
                                if (extract.includes('may refer to:') || extract.includes('most commonly refers to:')) {
                                    console.log('Skipping disambiguation page for:', title);
                                    continue;
                                }

                                console.log('✓ Wikipedia data found for:', title);
                                setWikiData(extract);
                                foundData = true;
                                break;
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching:', title, err);
                    }
                }

                if (!foundData) {
                    console.log('✗ No Wikipedia data found for:', data.companyName);
                }
            } catch (error) {
                console.error('Wikipedia fetch failed:', error);
            }
        };

        fetchWikiData();
    }, [showCompanyInfo, data.companyName, wikiData]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(val);
    };

    const formatMarketCap = (val) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        return formatCurrency(val);
    };

    const generateCompanyInfo = () => {
        const { metrics, marketCap, symbol, companyName } = data;

        // Extract founding information from Wikipedia if available
        let foundingInfo = '';
        let foundersInfo = '';
        let businessDescription = '';

        if (wikiData) {
            // Extract founding year - try multiple patterns
            const yearMatch = wikiData.match(/[Ff]ounded in (\d{4})|[Ff]ounding.*?(\d{4})|established in (\d{4})|incorporated.*?(\d{4})/);
            const foundingYear = yearMatch ? (yearMatch[1] || yearMatch[2] || yearMatch[3] || yearMatch[4]) : null;

            // Extract founders - try multiple patterns with better boundaries
            const foundersPatterns = [
                /[Ff]ounded.*?by ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/,  // Matches proper names like "Bill Gates and Paul Allen"
                /[Cc]o-founded by ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/,
                /[Ff]ounder[s]?:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/
            ];

            let founders = null;
            for (const pattern of foundersPatterns) {
                const match = wikiData.match(pattern);
                if (match && match[1]) {
                    const extracted = match[1].trim();

                    // Validate: must contain at least one full name (first + last)
                    // and not be common non-name words
                    const invalidWords = /^(revenue|company|corporation|business|the|a|an|in|as|with|from)$/i;
                    const words = extracted.split(/\s+/);

                    // Check if it looks like actual names (at least 2 words, capitalized)
                    if (words.length >= 2 && !words.some(w => invalidWords.test(w))) {
                        founders = extracted;
                        break;
                    }
                }
            }

            // Get first 2-3 sentences for business description
            const sentences = wikiData.split(/\.\s+/).slice(0, 3).join('. ');
            businessDescription = sentences ? sentences + '.' : '';

            if (foundingYear || founders) {
                foundingInfo = `**Founded:** ${foundingYear || 'Year not available'}${founders ? ` by ${founders}` : ''}`;
            }
        }

        // Determine profitability
        const isProfitable = metrics.eps && metrics.eps > 0;
        const profitabilityStatus = isProfitable
            ? `profitable with earnings of $${metrics.eps?.toFixed(2)} per share`
            : metrics.eps < 0
                ? `currently loss-making with -$${Math.abs(metrics.eps)?.toFixed(2)} per share`
                : 'profitability status unavailable';

        // Business scale
        const businessScale = marketCap >= 200e9 ? 'mega-cap' :
            marketCap >= 10e9 ? 'large-cap' :
                marketCap >= 2e9 ? 'mid-cap' : 'small-cap';

        // Revenue efficiency
        const revenuePerShare = metrics.revenue && metrics.sharesOutstanding
            ? (metrics.revenue / (metrics.sharesOutstanding * 1e6)).toFixed(2)
            : 'N/A';

        return `
${businessDescription ? `**About:** ${businessDescription}\n\n` : ''}${foundingInfo ? `${foundingInfo}\n\n` : ''}**Company Overview:** ${companyName} (${symbol}) is a publicly traded ${businessScale} company with a market capitalization of ${formatMarketCap(marketCap)}.

**Business Model:** The company generates ${formatMarketCap(metrics.revenue)} in annual revenue${metrics.revenueGrowth ? `, growing at ${metrics.revenueGrowth?.toFixed(1)}% year-over-year` : ''}. With revenue per share of $${revenuePerShare}, the business operates at ${metrics.sharesOutstanding?.toFixed(2)}M shares outstanding.

**Profitability:** ${companyName} is ${profitabilityStatus}. The company trades at a P/E ratio of ${metrics.pe?.toFixed(1) || 'N/A'}${isProfitable && metrics.pe ? `, ${metrics.pe > 30 ? 'indicating premium market expectations' : metrics.pe > 15 ? 'reflecting moderate valuation' : 'suggesting value opportunity'}` : ''}.

**Shareholder Returns:** ${metrics.dividendYield ? `The stock pays a dividend yield of ${metrics.dividendYield?.toFixed(2)}%, providing income to shareholders.` : 'The company does not currently pay dividends, likely reinvesting profits for growth.'} With a beta of ${metrics.beta?.toFixed(2) || 'N/A'}, the stock shows ${metrics.beta > 1.2 ? 'higher' : metrics.beta < 0.8 ? 'lower' : 'average'} volatility compared to the broader market.
        `.trim();
    };

    const generateMarketTrends = () => {
        const { metrics, earnings, price, week52High, week52Low } = data;

        // Price position analysis
        const priceRange = week52High - week52Low;
        const pricePosition = ((price - week52Low) / priceRange) * 100;
        const priceLevel = pricePosition >= 75 ? 'near 52-week highs' :
            pricePosition <= 25 ? 'near 52-week lows' :
                'mid-range';

        // Valuation analysis
        const peAnalysis = metrics.pe ?
            (metrics.pe > 30 ? 'premium valuation' :
                metrics.pe > 20 ? 'moderate valuation' :
                    'attractive valuation') : 'N/A';

        // Growth analysis
        const growthTrend = metrics.revenueGrowth > 15 ? 'strong growth' :
            metrics.revenueGrowth > 5 ? 'steady growth' :
                metrics.revenueGrowth > 0 ? 'modest growth' : 'declining';

        // Earnings momentum
        const latestEarnings = earnings[0];
        const earningsMomentum = latestEarnings?.surprisePercent > 5 ? 'strong earnings beat' :
            latestEarnings?.surprisePercent > 0 ? 'earnings beat' :
                latestEarnings?.surprisePercent < -5 ? 'significant earnings miss' :
                    'earnings miss';

        return `
**Price Action:** ${data.symbol} is trading ${priceLevel} at ${formatCurrency(price)}, ${pricePosition.toFixed(0)}% through its 52-week range.

**Valuation:** The stock shows ${peAnalysis} with a P/E ratio of ${metrics.pe?.toFixed(1) || 'N/A'} and PEG of ${metrics.peg?.toFixed(2) || 'N/A'}.

**Growth Profile:** ${data.companyName} is experiencing ${growthTrend} with ${metrics.revenueGrowth?.toFixed(1) || 'N/A'}% YoY revenue growth and ${formatMarketCap(metrics.revenue)} in TTM revenue.

**Earnings Momentum:** Latest quarter showed ${earningsMomentum} with ${latestEarnings?.surprisePercent > 0 ? '+' : ''}${latestEarnings?.surprisePercent?.toFixed(1) || 'N/A'}% surprise.

**Risk Metrics:** Beta of ${metrics.beta?.toFixed(2) || 'N/A'} indicates ${metrics.beta > 1.2 ? 'higher' : metrics.beta < 0.8 ? 'lower' : 'average'} volatility vs. market.
        `.trim();
    };

    return (
        <div className={styles.displayContainer}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.symbol}>{data.symbol}</div>
                    <div id="selected-company-name" className={styles.companyName}>{data.companyName}</div>
                    <button
                        className={styles.companyInfoButton}
                        onClick={() => setShowCompanyInfo(!showCompanyInfo)}
                    >
                        {showCompanyInfo ? '▲ Hide Info' : '▼ Company Info'}
                    </button>
                </div>
                <div className={styles.buttonGroup}>
                    <button
                        className={styles.aiButton}
                        onClick={() => setShowPrediction(true)}
                    >
                        ✨ AI Predict
                    </button>
                    <button
                        className={styles.trendsButton}
                        onClick={() => setShowTrends(!showTrends)}
                    >
                        {showTrends ? 'Close Trends' : 'Market Trends'}
                    </button>
                    <button
                        className={styles.watchlistButton}
                        onClick={() => onAddToWatchlist(data)}
                    >
                        {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>

            {showCompanyInfo && (
                <div className={styles.companyInfoPanel}>
                    {wikiData ? (
                        <div className={styles.companyInfoContent}>
                            {generateCompanyInfo().split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className={styles.companyInfoText}>
                                    {paragraph.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                    )}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.companyInfoContent}>
                            {generateCompanyInfo().split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className={styles.companyInfoText}>
                                    {paragraph.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                    )}
                                </p>
                            ))}
                            <p className={styles.companyInfoText} style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                Loading company history from Wikipedia...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {showTrends && (
                <div className={styles.trendsModal}>
                    <h3 className={styles.trendsTitle}>📊 Market Trends Analysis</h3>
                    <div className={styles.trendsContent}>
                        {generateMarketTrends().split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className={styles.trendsParagraph}>
                                {paragraph.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                )}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            <NewsSummary news={data.news} symbol={data.symbol} />

            {showPrediction && (
                <div ref={predictionRef}>
                    <AIPredictionPanel
                        symbol={data.symbol}
                        currentPrice={data.price}
                        onClose={() => setShowPrediction(false)}
                    />
                </div>
            )}

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.label}>Current Price</div>
                    <div className={styles.value}>{formatCurrency(data.price)}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>Market Cap</div>
                    <div className={styles.value}>{formatMarketCap(data.marketCap)}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>52-Week High</div>
                    <div className={styles.value}>{formatCurrency(data.week52High)}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>52-Week Low</div>
                    <div className={styles.value}>{formatCurrency(data.week52Low)}</div>
                </div>
            </div>

            <StockChart symbol={data.symbol} basePrice={data.price} />

            <FinancialMetrics metrics={data.metrics} />

            <EarningsSection earnings={data.earnings} />
        </div>
    );
}
