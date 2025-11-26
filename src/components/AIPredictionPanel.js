"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './AIPredictionPanel.module.css';

export default function AIPredictionPanel({ symbol, currentPrice, onClose }) {
    const [step, setStep] = useState('loading'); // loading, result
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing AI...');
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        // Simulation sequence
        const sequence = async () => {
            // Phase 1: Scanning
            setStatusText(`Scanning news for ${symbol}...`);
            await animateProgress(0, 30, 1000);

            // Phase 2: Analyzing
            setStatusText('Analyzing market sentiment...');
            await animateProgress(30, 60, 1500);

            // Phase 3: Calculating
            setStatusText('Calculating technical indicators...');
            await animateProgress(60, 90, 1000);

            // Fetch "Prediction"
            try {
                const res = await fetch(`/api/predict?symbol=${symbol}&currentPrice=${currentPrice}`);
                const data = await res.json();
                setPrediction(data);

                setStatusText('Finalizing prediction...');
                await animateProgress(90, 100, 500);

                setStep('result');
            } catch (e) {
                console.error(e);
                onClose();
            }
        };

        sequence();
    }, [symbol, currentPrice]);

    const animateProgress = (start, end, duration) => {
        return new Promise(resolve => {
            const startTime = Date.now();
            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const percentage = Math.min(elapsed / duration, 1);

                const current = start + (end - start) * percentage;
                setProgress(current);

                if (percentage < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    };

    const calculateChange = () => {
        if (!prediction || !currentPrice) return null;
        const diff = prediction.predictedPrice - currentPrice;
        const percent = (diff / currentPrice) * 100;
        return {
            diff,
            percent,
            isPositive: diff >= 0
        };
    };

    const changeData = calculateChange();

    const handleShare = async () => {
        if (!prediction) return;

        const changeText = changeData.isPositive ? '+' : '';
        const text = `AI Prediction for ${symbol}: $${prediction.predictedPrice.toFixed(2)} (${changeText}${changeData.percent.toFixed(2)}%). ${prediction.reasoning.split('.')[0]}.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `AI Stock Prediction: ${symbol}`,
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(text);
            alert('Prediction copied to clipboard!');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>AI Market Predictor</h2>
                <div className={styles.headerButtons}>
                    <button className={styles.shareButton} onClick={handleShare} disabled={step !== 'result'}>
                        Share Prediction
                    </button>
                    <button className={styles.closeButton} onClick={onClose}>
                        Close Prediction
                    </button>
                </div>
            </div>

            {step === 'loading' ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <div className={styles.statusText}>{statusText}</div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <div className={styles.resultContainer}>
                    <div className={styles.predictionCard}>
                        <div className={styles.predictionLabel}>5-Day Forecast</div>
                        <div className={styles.predictionValue}>
                            ${prediction?.predictedPrice?.toFixed(2)}
                        </div>
                        {changeData && (
                            <div className={`${styles.changeValue} ${changeData.isPositive ? styles.positive : styles.negative}`}>
                                {changeData.isPositive ? '▲' : '▼'} {Math.abs(changeData.percent).toFixed(2)}%
                                ({changeData.isPositive ? '+' : ''}{changeData.diff.toFixed(2)})
                            </div>
                        )}
                        <div className={styles.confidence}>
                            {prediction?.confidence}% Confidence
                        </div>
                    </div>

                    {prediction?.predictionGraph && (
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={prediction.predictionGraph}>
                                    <defs>
                                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={changeData?.isPositive ? "#34d399" : "#f87171"} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={changeData?.isPositive ? "#34d399" : "#f87171"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${val.toFixed(0)}`}
                                        width={40}
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
                                        stroke={changeData?.isPositive ? "#34d399" : "#f87171"}
                                        fillOpacity={1}
                                        fill="url(#colorPred)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className={styles.reasoning}>
                        <div className={styles.reasoningTitle}>AI Analysis</div>
                        <div dangerouslySetInnerHTML={{ __html: prediction?.reasoning?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>

                    <div className={styles.sources}>
                        <span className={styles.sourcesLabel}>Analyzed Sources:</span>
                        <div className={styles.sourceTags}>
                            {prediction?.sources?.map((source, i) => (
                                <span key={i} className={styles.sourceTag}>{source}</span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.disclaimer}>
                        Disclaimer: This is an AI-generated prediction for informational purposes only. Do your own research before investing.
                    </div>
                </div>
            )}
        </div>
    );
}
