import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const range = searchParams.get('range') || '1D';
    const apiKey = process.env.STOCK_API_KEY;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Determine resolution and time range based on selected period
    let resolution = '5'; // default to 5 min
    let from = Math.floor(Date.now() / 1000);
    let to = Math.floor(Date.now() / 1000);

    const now = Math.floor(Date.now() / 1000);

    switch (range) {
        case '1D':
            resolution = '5'; // 5 minute intervals
            from = now - 24 * 60 * 60; // 24 hours ago
            break;
        case '1W':
            resolution = '60'; // 1 hour intervals
            from = now - 7 * 24 * 60 * 60;
            break;
        case '1M':
            resolution = 'D'; // Daily
            from = now - 30 * 24 * 60 * 60;
            break;
        case '3M':
            resolution = 'D'; // Daily
            from = now - 90 * 24 * 60 * 60;
            break;
        case '1Y':
            resolution = 'W'; // Weekly
            from = now - 365 * 24 * 60 * 60;
            break;
        case '5Y':
            resolution = 'W'; // Weekly
            from = now - 5 * 365 * 24 * 60 * 60;
            break;
        case 'YTD':
            resolution = 'D'; // Daily
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            from = Math.floor(startOfYear.getTime() / 1000);
            break;
        default:
            resolution = 'D';
            from = now - 30 * 24 * 60 * 60;
    }

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
        );
        const data = await response.json();

        console.log(`Finnhub Candles [${symbol}, ${resolution}]:`, data.s, data.c ? data.c.length : 0);

        if (data.s === 'ok') {
            // Transform data for Recharts
            // Finnhub returns { c: [close prices], t: [timestamps], ... }
            const chartData = data.t.map((timestamp, index) => ({
                time: range === '1D' || range === '1W'
                    ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(timestamp * 1000).toLocaleDateString(),
                price: data.c[index]
            }));

            return NextResponse.json({ data: chartData });
        } else {
            // Return raw status for debugging
            return NextResponse.json({ data: [], status: data.s, debug: data });
        }
    } catch (error) {
        console.error('Finnhub Candle API error:', error);
        return NextResponse.json({ error: 'Failed to fetch candle data' }, { status: 500 });
    }
}
