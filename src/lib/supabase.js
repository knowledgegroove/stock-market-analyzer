import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Create a singleton Supabase client for client-side use (only if configured)
export const supabase = isSupabaseConfigured
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : null;

// Helper function to get the current user
export async function getCurrentUser() {
    if (!supabase) return null;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

// Helper function to sign out
export async function signOut() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}
