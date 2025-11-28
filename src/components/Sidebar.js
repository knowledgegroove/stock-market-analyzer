"use client";

import { useState, useEffect } from 'react';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';
import styles from './Sidebar.module.css';

const TRENDING_SYMBOLS = [
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'AMD', name: 'AMD' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'PLTR', name: 'Palantir' },
    { symbol: 'COIN', name: 'Coinbase' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOGL', name: 'Alphabet' },
];

export default function Sidebar({ watchlist, onSelectStock, user, onOpenAuth, onUserChange }) {
    const [trendingStocks, setTrendingStocks] = useState([]);

    useEffect(() => {
        const fetchTrendingData = async () => {
            try {
                const promises = TRENDING_SYMBOLS.map(async (stock) => {
                    try {
                        const res = await fetch(`/api/stock?symbol=${stock.symbol}`);
                        const data = await res.json();
                        if (data.price) {
                            // Calculate change percentage if available, otherwise mock it or leave empty
                            // The current API returns price, but maybe not change % directly in the main object
                            // Let's check what the API returns. 
                            // It returns: symbol, companyName, price, marketCap, week52High, week52Low, news, earnings, companyInfo, metrics
                            // It doesn't seem to return daily change % directly in the top level.
                            // However, we can calculate it if we had previous close. 
                            // For now, let's just show the price. 
                            // Wait, the previous hardcoded data had change %. 
                            // Let's see if we can get change data. 
                            // The /api/stock route uses Finnhub quote which has 'd' (change) and 'dp' (change percent).
                            // Let's check /api/stock/route.js to see if it passes those through.
                            return {
                                symbol: stock.symbol,
                                name: stock.name,
                                price: data.price,
                                change: data.changePercent ? `${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` : '0.00%'
                            };
                        }
                    } catch (e) {
                        console.error(`Failed to fetch ${stock.symbol}`, e);
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                const validResults = results.filter(r => r !== null);
                setTrendingStocks(validResults);
            } catch (error) {
                console.error('Error fetching trending stocks:', error);
            }
        };

        fetchTrendingData();
    }, []);

    // Use trendingStocks if available, otherwise show loading or empty
    const displayStocks = trendingStocks.length > 0 ? trendingStocks : TRENDING_SYMBOLS.map(s => ({ ...s, price: '...', change: '...' }));

    return (
        <aside className={styles.sidebar}>
            <div className={styles.scrollableContent}>
                <div>
                    <h3 id="sidebar-trending-title" className={styles.sectionTitle}>Trending Stocks</h3>
                    <div className={styles.trendingContainer}>
                        <div className={styles.trendingTrack}>
                            {/* Duplicate list for seamless loop */}
                            {[...displayStocks, ...displayStocks].map((stock, index) => (
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
                                        <div className={styles.price}>
                                            {stock.price === '...' ? '...' : `$${typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}`}
                                        </div>
                                        <div className={`${styles.change} ${stock.change.startsWith('+') ? styles.positive : stock.change.startsWith('-') ? styles.negative : ''}`}>
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
                                {!user ? 'Sign in to access watchlist and other features' : 'No stocks in watchlist'}
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
                                        <div className={styles.price}>${typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.authFooter}>
                <ThemeToggle />
                <AuthButton
                    user={user}
                    onOpenAuth={onOpenAuth}
                    onUserChange={onUserChange}
                />
            </div>
        </aside >
    );
}
