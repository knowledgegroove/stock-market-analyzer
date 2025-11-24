"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './StockChart.module.css';

const PERIODS = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'];

// Generate mock data for fallback
const generateMockData = (symbol, period, basePrice = 150) => {
    const data = [];
    const now = new Date();
    let points = 50;
    let resolution = 'day'; // 'minute', 'hour', 'day'

    switch (period) {
        case '1D': points = 24; resolution = 'hour'; break;
        case '1W': points = 7; resolution = 'day'; break;
        case '1M': points = 30; resolution = 'day'; break;
        case '3M': points = 90; resolution = 'day'; break;
        case 'YTD':
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const daysDiff = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
            points = daysDiff;
            resolution = 'day';
            break;
        case '1Y': points = 52; resolution = 'week'; break;
        case '5Y': points = 260; resolution = 'week'; break;
    }

    let currentPrice = basePrice;

    for (let i = points; i >= 0; i--) {
        const date = new Date(now);
        if (resolution === 'hour') date.setHours(date.getHours() - i);
        else if (resolution === 'day') date.setDate(date.getDate() - i);
        else if (resolution === 'week') date.setDate(date.getDate() - i * 7);

        // Random walk
        const change = (Math.random() - 0.5) * (basePrice * 0.05);
        currentPrice += change;

        data.push({
            time: resolution === 'hour'
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString(),
            price: Math.max(0.01, currentPrice)
        });
    }
    return data;
};

export default function StockChart({ symbol, basePrice }) {
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('1D');
    const [isLoading, setIsLoading] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/stock/candles?symbol=${symbol}&range=${period}`);
                const result = await response.json();

                if (result.data && result.data.length > 0) {
                    setData(result.data);
                } else {
                    // Fallback to mock data if API fails or returns no data
                    console.warn('Using mock data for chart due to API limit/error');
                    setData(generateMockData(symbol, period, basePrice));
                }
            } catch (error) {
                console.error('Error fetching chart data:', error);
                setData(generateMockData(symbol, period, basePrice));
            } finally {
                setIsLoading(false);
            }
        };

        if (symbol) {
            fetchData();
        }
    }, [symbol, period, basePrice]);

    // Determine color based on price movement
    const isPositive = data.length > 0 && data[data.length - 1].price >= data[0].price;
    const color = isPositive ? '#10b981' : '#ef4444';

    if (!isMounted) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3 className={styles.title}>Price Action</h3>
                </div>
                <div style={{ height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    Loading chart...
                </div>
            </div>
        );
    }

    if (isLoading && data.length === 0) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3 className={styles.title}>Price Action</h3>
                </div>
                <div style={{ height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    Loading chart...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3 className={styles.title}>Price Action</h3>
                <div className={styles.controls}>
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val.toFixed(2)}`}
                        width={60}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val) => [`$${val.toFixed(2)}`, 'Price']}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
