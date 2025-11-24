import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const apiKey = process.env.STOCK_API_KEY;

    if (!q) {
        return NextResponse.json({ result: [] });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${apiKey}`
        );
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Finnhub Search API error:', error);
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
