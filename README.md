# Stock Market Analyzer

A premium, modern stock market analysis web application built with Next.js, featuring real-time stock data, interactive charts, AI-powered insights, and comprehensive financial metrics.

## Features

- 🔍 **Real-time Stock Search** - Search and analyze any stock by symbol
- 📊 **Interactive Price Charts** - View historical price data with multiple timeframes (1D, 1W, 1M, 3M, YTD, 1Y, 5Y)
- 💰 **Financial Metrics** - Comprehensive display of P/E ratio, PEG ratio, EPS, revenue, market cap, and more
- 📈 **Earnings Analysis** - Quarterly earnings performance with surprise percentages
- 🤖 **AI-Powered News Summary** - Sentiment analysis on recent company news with interactive chat
- 📊 **Market Trends Analysis** - AI-generated insights on price action, valuation, and growth
- 📚 **Company Information** - Wikipedia-powered company history, founders, and business model details
- 💼 **Watchlist** - Save and track your favorite stocks
- 🔥 **Trending Stocks** - Revolving list of top trending stocks

## Tech Stack

- **Framework**: Next.js 15.0.3
- **UI**: React 19 with CSS Modules
- **Charts**: Recharts
- **APIs**: 
  - Finnhub API (real-time quotes, news, company profiles)
  - Alpha Vantage API (financial metrics, earnings data)
  - Wikipedia API (company information)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - [Finnhub](https://finnhub.io/) (free tier available)
  - [Alpha Vantage](https://www.alphavantage.co/) (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/stock-market-analyzer.git
cd stock-market-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
STOCK_API_KEY=your_finnhub_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Search for a stock** - Enter a stock symbol (e.g., AAPL, GOOGL, TSLA) in the search bar
2. **View stock details** - See real-time price, market cap, 52-week high/low, and interactive charts
3. **Explore financial metrics** - Review comprehensive financial data including P/E ratio, revenue growth, and profitability
4. **Check earnings** - View quarterly earnings performance and upcoming earnings dates
5. **Read AI insights** - Get AI-powered sentiment analysis and market trends
6. **Learn about the company** - Click "Company Info" to see founding details and business model
7. **Add to watchlist** - Save stocks to your personal watchlist for quick access

## Features in Detail

### Interactive Charts
- Multiple timeframes: 1 Day, 1 Week, 1 Month, 3 Months, Year-to-Date, 1 Year, 5 Years
- Dynamic color coding based on price movement
- Smooth animations and responsive design

### AI-Powered Insights
- **News Sentiment**: Analyzes recent news headlines to determine market sentiment
- **Interactive Chat**: Ask questions about the sentiment analysis
- **Market Trends**: Comprehensive analysis of price action, valuation, growth, and risk metrics

### Company Information
- Automatically fetches company history from Wikipedia
- Displays founding year and founders
- Shows business model and profitability status
- Includes shareholder return information

## API Rate Limits

- **Finnhub Free Tier**: 60 API calls/minute
- **Alpha Vantage Free Tier**: 25 API calls/day

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Stock data provided by [Finnhub](https://finnhub.io/)
- Financial metrics from [Alpha Vantage](https://www.alphavantage.co/)
- Company information from [Wikipedia](https://www.wikipedia.org/)
- Charts powered by [Recharts](https://recharts.org/)
