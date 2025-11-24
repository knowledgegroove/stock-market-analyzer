"use client";

import styles from './FinancialMetrics.module.css';

export default function FinancialMetrics({ metrics }) {
    if (!metrics) return null;

    const formatNumber = (num, prefix = '', suffix = '') => {
        if (num === null || num === undefined) return 'N/A';
        return `${prefix}${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
    };

    const formatLargeNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        // Handle actual dollar amounts (from Alpha Vantage)
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        // Handle millions (from Finnhub - for shares outstanding)
        if (num >= 1000) return `${(num / 1000).toFixed(2)}B`;
        return `${num.toFixed(2)}M`;
    };

    const items = [
        { label: 'P/E Ratio', value: formatNumber(metrics.pe) },
        { label: 'PEG Ratio', value: formatNumber(metrics.peg) },
        { label: 'EPS (TTM)', value: formatNumber(metrics.eps, '$') },
        { label: 'Revenue (TTM)', value: formatLargeNumber(metrics.revenue) },
        { label: 'Rev Growth (YoY)', value: formatNumber(metrics.revenueGrowth, '', '%') },
        { label: 'Shares Out', value: formatLargeNumber(metrics.sharesOutstanding) },
        { label: 'Div Yield', value: formatNumber(metrics.dividendYield, '', '%') },
        { label: 'Beta', value: formatNumber(metrics.beta) },
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Key Metrics</h3>
            <div className={styles.grid}>
                {items.map((item) => (
                    <div key={item.label} className={styles.card}>
                        <span className={styles.label}>{item.label}</span>
                        <span className={styles.value}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
