"use client";

import { useState } from 'react';
import styles from './NewsPanel.module.css';

export default function NewsPanel({ news, symbol }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!symbol) {
        return (
            <aside className={styles.panel}>
                <div className={styles.emptyState}>
                    Select a stock to view latest news and sentiment.
                </div>
            </aside>
        );
    }

    if (isCollapsed) {
        return (
            <div className={styles.collapsedPanel} onClick={() => setIsCollapsed(false)}>
                <div className={styles.verticalText}>Latest News</div>
                <button className={styles.expandButton}>←</button>
            </div>
        );
    }

    return (
        <aside className={styles.panel}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>Latest News for {symbol}</h3>
                <button
                    className={styles.hideButton}
                    onClick={() => setIsCollapsed(true)}
                    title="Hide News"
                >
                    Hide →
                </button>
            </div>

            <div className={styles.newsList}>
                {news && news.length > 0 ? (
                    news.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.newsItem}
                        >
                            <h4 className={styles.headline}>{item.headline}</h4>
                            <p className={styles.summary}>{item.summary}</p>
                            <div className={styles.meta}>
                                <span className={styles.source}>{item.source}</span>
                                <span>{new Date(item.datetime * 1000).toLocaleDateString()}</span>
                            </div>
                        </a>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        No recent news found for {symbol}.
                    </div>
                )}
            </div>
        </aside>
    );
}
