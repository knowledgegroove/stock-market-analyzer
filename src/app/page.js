"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './page.module.css';
import StockSearch from '@/components/StockSearch';
import StockDisplay from '@/components/StockDisplay';
import Sidebar from '@/components/Sidebar';
import NewsPanel from '@/components/NewsPanel';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const resultsRef = useRef(null);

  // Check for existing session and set up auth listener (only if Supabase is configured)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Fall back to localStorage
      const saved = localStorage.getItem('stockWatchlist');
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadWatchlist();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadWatchlist();
      } else {
        setWatchlist([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage when Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured && watchlist.length >= 0) {
      localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
    }
  }, [watchlist]);

  // Load watchlist from Supabase
  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const data = await response.json();

      if (response.ok && data.watchlist) {
        // Convert from database format to app format
        const formattedWatchlist = data.watchlist.map(item => ({
          symbol: item.symbol,
          companyName: item.company_name,
          price: parseFloat(item.price)
        }));
        setWatchlist(formattedWatchlist);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  // Auto-scroll to results when data is loaded
  useEffect(() => {
    if (stockData && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const toggleWatchlist = async (stock) => {
    // If Supabase not configured, use localStorage
    if (!isSupabaseConfigured) {
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
      return;
    }

    // Require auth when Supabase is configured
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const exists = watchlist.find(s => s.symbol === stock.symbol);

    try {
      if (exists) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist?symbol=${stock.symbol}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setWatchlist(prev => prev.filter(s => s.symbol !== stock.symbol));
        }
      } else {
        // Add to watchlist
        console.log('Adding to watchlist:', {
          symbol: stock.symbol,
          companyName: stock.companyName,
          price: stock.price
        });

        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: stock.symbol,
            companyName: stock.companyName,
            price: stock.price
          }),
        });

        const data = await response.json();
        console.log('Add to watchlist response:', response.status, data);

        if (response.ok) {
          setWatchlist(prev => [...prev, {
            symbol: stock.symbol,
            companyName: stock.companyName,
            price: stock.price
          }]);
        } else {
          console.error('Failed to add to watchlist:', data.error);
          alert(`Failed to add to watchlist: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(s => s.symbol === symbol);
  };

  return (
    <main className={styles.main}>
      <Sidebar
        watchlist={watchlist}
        onSelectStock={handleSearch}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onUserChange={setUser}
      /> <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>
                Stock Market <span className={styles.highlight}>Analyzer</span>
              </h1>
              <p className={styles.subtitle}>
                Real-time market insights at your fingertips
              </p>
            </div>
          </div>

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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          loadWatchlist();
        }}
      />
    </main>
  );
}
