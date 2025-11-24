"use client";

import styles from './Sidebar.module.css';

const TRENDING_STOCKS = [
    { symbol: 'NVDA', name: 'NVIDIA', price: 485.09, change: '+2.4%' },
    { symbol: 'AMD', name: 'AMD', price: 138.00, change: '+1.8%' },
    { symbol: 'META', name: 'Meta', price: 334.92, change: '-0.5%' },
    { symbol: 'PLTR', name: 'Palantir', price: 17.80, change: '+3.2%' },
    { symbol: 'COIN', name: 'Coinbase', price: 141.99, change: '+5.1%' },
    { symbol: 'TSLA', name: 'Tesla', price: 234.20, change: '-1.2%' },
    { symbol: 'AAPL', name: 'Apple', price: 191.45, change: '+0.8%' },
    { symbol: 'MSFT', name: 'Microsoft', price: 374.50, change: '+1.1%' },
    { symbol: 'AMZN', name: 'Amazon', price: 146.70, change: '-0.3%' },
    { symbol: 'GOOGL', name: 'Alphabet', price: 133.40, change: '+0.9%' },
];

export default function Sidebar({ watchlist, onSelectStock }) {
    return (
        <aside className={styles.sidebar}>
            <div>
                <h3 className={styles.sectionTitle}>Trending Stocks</h3>
                <div className={styles.trendingContainer}>
                    <div className={styles.trendingTrack}>
                        {/* Duplicate list for seamless loop */}
                        {[...TRENDING_STOCKS, ...TRENDING_STOCKS].map((stock, index) => (
                            <div
                                key={`trending-${stock.symbol}-${index}`}
                                className={styles.stockItem}
                                onClick={() => onSelectStock(stock.symbol)}
                            >
                                <div>
                                    <div className={styles.symbol}>{stock.symbol}</div>
                                    <div className={styles.name}>{stock.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className={styles.price}>${stock.price}</div>
                                    <div className={`${styles.change} ${stock.change.startsWith('+') ? styles.positive : styles.negative}`}>
                                        {stock.change}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h3 className={styles.sectionTitle}>Your Watchlist</h3>
                <div className={styles.stockList}>
                    {watchlist.length === 0 ? (
                        <div className={styles.emptyState}>
                            No stocks in watchlist
                        </div>
                    ) : (
                        watchlist.map((stock, index) => (
                            <div
                                key={`watchlist-${stock.symbol}-${index}`}
                                className={styles.stockItem}
                                onClick={() => onSelectStock(stock.symbol)}
                            >
                                <div>
                                    <div className={styles.symbol}>{stock.symbol}</div>
                                    <div className={styles.name}>{stock.companyName}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className={styles.price}>${stock.price}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
