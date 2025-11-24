"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import StockSearch from '@/components/StockSearch';
import StockDisplay from '@/components/StockDisplay';
import Sidebar from '@/components/Sidebar';
import NewsPanel from '@/components/NewsPanel';

export default function Home() {
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('stockWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSearch = async (symbol) => {
    setIsLoading(true);
    setError(null);
    setStockData(null);

    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stock data');
      }

      setStockData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchlist = (stock) => {
    setWatchlist(prev => {
      const exists = prev.find(s => s.symbol === stock.symbol);
      if (exists) {
        return prev.filter(s => s.symbol !== stock.symbol);
      }
      return [...prev, {
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: stock.price
      }];
    });
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(s => s.symbol === symbol);
  };

  return (
    <main className={styles.main}>
      <Sidebar watchlist={watchlist} onSelectStock={handleSearch} />

      <div className={styles.content}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            Stock Market <span className={styles.highlight}>Analyzer</span>
          </h1>
          <p className={styles.subtitle}>
            Real-time market insights at your fingertips
          </p>

          <div className={styles.searchWrapper}>
            <StockSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {stockData && (
            <StockDisplay
              data={stockData}
              onAddToWatchlist={toggleWatchlist}
              isInWatchlist={isInWatchlist(stockData.symbol)}
            />
          )}
        </div>
      </div>

      <NewsPanel news={stockData?.news} symbol={stockData?.symbol} />
    </main>
  );
}
