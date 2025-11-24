"use client";

import styles from './EarningsSection.module.css';

export default function EarningsSection({ earnings }) {
    if (!earnings || earnings.length === 0) return null;

    // Get the most recent reported quarter
    const latest = earnings[0];

    // Calculate surprise percentage
    const surprisePercent = latest.surprisePercent
        ? latest.surprisePercent
        : ((latest.actual - latest.estimate) / Math.abs(latest.estimate)) * 100;

    // Estimate next earnings date based on historical quarterly pattern
    // Most companies report ~30-45 days after quarter end
    const lastReportDate = new Date(latest.period);

    // Calculate average days between last 2-3 reports to find pattern
    let avgDaysBetween = 91; // Default to ~3 months
    if (earnings.length >= 2) {
        const date1 = new Date(earnings[0].period);
        const date2 = new Date(earnings[1].period);
        avgDaysBetween = Math.round((date1 - date2) / (1000 * 60 * 60 * 24));
    }

    // Estimate next report date
    const nextReportDate = new Date(lastReportDate);
    nextReportDate.setDate(nextReportDate.getDate() + avgDaysBetween);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Earnings Performance</h3>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.dateGroup}>
                        <span className={styles.dateLabel}>Last Reported (Q{latest.quarter})</span>
                        <span className={styles.dateValue}>{latest.period}</span>
                    </div>
                    <div className={styles.dateGroup} style={{ alignItems: 'flex-end' }}>
                        <span className={styles.dateLabel}>Next Reported (Est)</span>
                        <span className={styles.dateValue}>{nextReportDate.toISOString().split('T')[0]}</span>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.label}>EPS Actual</span>
                        <span className={styles.value}>${latest.actual?.toFixed(2)}</span>
                        <span className={styles.estimate}>Est: ${latest.estimate?.toFixed(2)}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.label}>Surprise</span>
                        <span className={`${styles.value} ${surprisePercent >= 0 ? styles.positive : styles.negative}`}>
                            {surprisePercent > 0 ? '+' : ''}{surprisePercent?.toFixed(2)}%
                        </span>
                        <span className={styles.estimate}>
                            {latest.surprise?.toFixed(2)} (Abs)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
