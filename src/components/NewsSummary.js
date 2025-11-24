"use client";

import { useMemo, useState } from 'react';
import styles from './NewsSummary.module.css';

export default function NewsSummary({ news, symbol }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    const analysis = useMemo(() => {
        if (!news || news.length === 0) return null;

        const positiveKeywords = ['up', 'rise', 'gain', 'bull', 'high', 'record', 'beat', 'strong', 'growth', 'surge', 'jump', 'buy', 'outperform'];
        const negativeKeywords = ['down', 'fall', 'drop', 'bear', 'low', 'miss', 'weak', 'loss', 'decline', 'crash', 'sell', 'underperform'];

        let score = 50; // Start neutral
        let positiveHits = 0;
        let negativeHits = 0;
        let keyHeadline = news[0].headline;

        news.forEach(item => {
            const text = (item.headline + ' ' + item.summary).toLowerCase();

            positiveKeywords.forEach(word => {
                if (text.includes(word)) {
                    score += 5;
                    positiveHits++;
                }
            });

            negativeKeywords.forEach(word => {
                if (text.includes(word)) {
                    score -= 5;
                    negativeHits++;
                }
            });
        });

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        let sentiment = 'Neutral';
        let sentimentClass = styles.neutral;
        let bgClass = styles.neutralBg;

        if (score >= 60) {
            sentiment = 'Bullish';
            sentimentClass = styles.bullish;
            bgClass = styles.bullishBg;
        } else if (score <= 40) {
            sentiment = 'Bearish';
            sentimentClass = styles.bearish;
            bgClass = styles.bearishBg;
        }

        // Generate summary text
        let summary = `Market sentiment for ${symbol} appears ${sentiment.toLowerCase()}. `;
        if (positiveHits > negativeHits) {
            summary += `Recent news highlights positive momentum, with headlines like "${keyHeadline}".`;
        } else if (negativeHits > positiveHits) {
            summary += `Recent coverage suggests caution, noted by headlines such as "${keyHeadline}".`;
        } else {
            summary += `News coverage is mixed or quiet, with latest updates including "${keyHeadline}".`;
        }

        return { score, sentiment, sentimentClass, bgClass, summary, positiveHits, negativeHits };
    }, [news, symbol]);

    const generateResponse = (question) => {
        const q = question.toLowerCase();

        // Simple rule-based responses
        if (q.includes('why') || q.includes('explain')) {
            return `The ${analysis.sentiment.toLowerCase()} sentiment (score: ${analysis.score}/100) is based on analyzing ${news.length} recent news articles. I found ${analysis.positiveHits} positive signals and ${analysis.negativeHits} negative signals in the headlines and summaries.`;
        } else if (q.includes('news') || q.includes('headline')) {
            const topNews = news.slice(0, 3).map(n => n.headline).join('; ');
            return `Recent headlines include: ${topNews}`;
        } else if (q.includes('buy') || q.includes('sell') || q.includes('should')) {
            return `Based on sentiment alone (${analysis.sentiment}, ${analysis.score}/100), the news coverage is ${analysis.score >= 60 ? 'positive' : analysis.score <= 40 ? 'cautious' : 'mixed'}. However, sentiment is just one factor - always consider fundamentals, technicals, and your risk tolerance before making investment decisions.`;
        } else if (q.includes('risk')) {
            return `Sentiment score of ${analysis.score}/100 suggests ${analysis.score >= 60 ? 'lower near-term headline risk' : analysis.score <= 40 ? 'elevated headline risk' : 'moderate headline risk'}. Monitor news flow closely for ${symbol}.`;
        } else if (q.includes('change') || q.includes('trend')) {
            return `Current sentiment is ${analysis.sentiment} (${analysis.score}/100). To track changes, check back regularly as new articles are published. Sentiment can shift quickly with breaking news.`;
        } else {
            return `The current sentiment for ${symbol} is ${analysis.sentiment} with a score of ${analysis.score}/100. You can ask me about: why this score, recent news, risks, or investment implications.`;
        }
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user', content: inputValue };
        const aiResponse = { role: 'ai', content: generateResponse(inputValue) };

        setMessages([...messages, userMessage, aiResponse]);
        setInputValue('');
    };

    if (!analysis) return null;

    return (
        <div className={styles.container}>
            <div className={`${styles.card} ${analysis.bgClass}`}>
                <div className={styles.badgeContainer}>
                    <button
                        className={styles.chatButton}
                        onClick={() => setChatOpen(!chatOpen)}
                        title={chatOpen ? "Close chat" : "Learn more about sentiment"}
                    >
                        {chatOpen ? 'Close' : 'Learn More'}
                    </button>
                    <div className={styles.badge}>
                        AI Insight
                    </div>
                </div>

                <div className={styles.header}>
                    <div className={`${styles.sentimentScore} ${analysis.sentimentClass}`}>
                        {analysis.score}
                    </div>
                    <div className={styles.sentimentLabel}>
                        <span className={styles.labelTitle}>Sentiment Score</span>
                        <span className={`${styles.labelValue} ${analysis.sentimentClass}`}>
                            {analysis.sentiment}
                        </span>
                    </div>
                </div>

                <p className={styles.summaryText}>
                    {analysis.summary}
                </p>

                {chatOpen && (
                    <div className={styles.chatContainer}>
                        <div className={styles.chatMessages}>
                            {messages.length === 0 ? (
                                <div className={styles.chatPlaceholder}>
                                    Ask me anything about the sentiment analysis...
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={msg.role === 'user' ? styles.userMessage : styles.aiMessage}
                                    >
                                        {msg.content}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={styles.chatInput}>
                            <input
                                type="text"
                                placeholder="Ask about sentiment..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage}>Send</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
