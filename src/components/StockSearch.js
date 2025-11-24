"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './StockSearch.module.css';

export default function StockSearch({ onSearch, isLoading, initialValue = '' }) {
    const [symbol, setSymbol] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    // Update symbol when initialValue changes (e.g. from sidebar selection)
    useEffect(() => {
        if (initialValue) {
            setSymbol(initialValue);
            setShowDropdown(false); // Ensure dropdown is closed when value is set externally
        }
    }, [initialValue]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Don't fetch if symbol matches initialValue (prevents reopening on selection)
        if (symbol === initialValue && initialValue !== '') {
            return;
        }

        const fetchSuggestions = async () => {
            if (symbol.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(symbol)}`);
                const data = await response.json();
                if (data.result) {
                    // Filter for common stock types to reduce noise
                    const filtered = data.result
                        .filter(item => !item.symbol.includes('.')) // Prefer primary listings
                        .slice(0, 5);
                    setSuggestions(filtered);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [symbol, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (symbol.trim()) {
            onSearch(symbol.trim().toUpperCase());
            setShowDropdown(false);
        }
    };

    const handleSelect = (selectedSymbol) => {
        setSymbol(selectedSymbol);
        onSearch(selectedSymbol);
        setShowDropdown(false);
    };

    return (
        <div className={styles.searchWrapper} ref={wrapperRef} style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <form className={styles.searchContainer} onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Enter any stock (e.g. Apple)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    onFocus={() => symbol.length >= 2 && setShowDropdown(true)}
                    disabled={isLoading}
                />
                <button type="submit" className={styles.button} disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Analyze'}
                </button>
            </form>

            {showDropdown && suggestions.length > 0 && (
                <div className={styles.dropdown}>
                    {suggestions.map((item) => (
                        <div
                            key={item.symbol}
                            className={styles.dropdownItem}
                            onClick={() => handleSelect(item.symbol)}
                        >
                            <span className={styles.itemSymbol}>{item.symbol}</span>
                            <span className={styles.itemDesc}>{item.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
