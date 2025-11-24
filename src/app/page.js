"use client";

import { useState, useEffect, useRef } from 'react';
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
  const resultsRef = useRef(null);

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

  // Auto-scroll to results when data is loaded
  useEffect(() => {
    if (stockData && resultsRef.current) {
      setTimeout(() => {
        // Scroll to align company name with "Trending Stocks" in sidebar
        const yOffset = -180; // Adjusted offset to align with sidebar section title
        const element = resultsRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

        // Check if we actually need to scroll (if it's already in view, don't jump)
        if (element.getBoundingClientRect().top > window.innerHeight * 0.8) {
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          // Fallback to gentle scroll if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [stockData]);

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
            <StockSearch
              onSearch={handleSearch}
              isLoading={isLoading}
              initialValue={stockData?.symbol || ''}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div ref={resultsRef} style={{ width: '100%' }}>
            {stockData && (
              <StockDisplay
                data={stockData}
                onAddToWatchlist={toggleWatchlist}
                isInWatchlist={isInWatchlist(stockData.symbol)}
              />
            )}
          </div>
        </div>
      </div>

      <NewsPanel news={stockData?.news} symbol={stockData?.symbol} />
    </main>
  );
}
