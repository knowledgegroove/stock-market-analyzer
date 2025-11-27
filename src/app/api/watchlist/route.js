import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper to create Supabase client
async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

// GET - Fetch user's watchlist
export async function GET(request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch watchlist items
        const { data, error } = await supabase
            .from('watchlist_items')
            .select('*')
            .eq('user_id', user.id)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching watchlist:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ watchlist: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Add item to watchlist
export async function POST(request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('POST /api/watchlist: Unauthorized', userError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('POST /api/watchlist received:', body);

        const { symbol, companyName, price } = body;

        if (!symbol || !companyName || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure price is a number
        const numericPrice = parseFloat(price.toString().replace(/[^0-9.-]+/g, ""));

        // Insert watchlist item
        const { data, error } = await supabase
            .from('watchlist_items')
            .insert([
                {
                    user_id: user.id,
                    symbol,
                    company_name: companyName,
                    price: numericPrice
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding to watchlist:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('Unexpected error in POST /api/watchlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove item from watchlist
export async function DELETE(request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }

        // Delete watchlist item
        const { error } = await supabase
            .from('watchlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol);

        if (error) {
            console.error('Error removing from watchlist:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
