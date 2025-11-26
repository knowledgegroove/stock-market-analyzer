"use client";

import { useState, useEffect } from 'react';
import styles from './AIPredictionModal.module.css';

export default function AIPredictionModal({ symbol, currentPrice, onClose }) {
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

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>

                <div className={styles.header}>
                    <h2 className={styles.title}>AI Market Predictor</h2>
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

                        <div className={styles.reasoning}>
                            {prediction?.reasoning}
                        </div>

                        <div className={styles.sources}>
                            <span className={styles.sourcesLabel}>Analyzed Sources:</span>
                            <div className={styles.sourceTags}>
                                {prediction?.sources?.map((source, i) => (
                                    <span key={i} className={styles.sourceTag}>{source}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
