# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in:
   - Project name: `stock-market-analyzer`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
4. Click "Create new project" and wait for it to initialize

## 2. Get API Credentials
1. In your project dashboard, click the **Settings** icon (gear) in the left sidebar
2. Click **API** in the settings menu
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## 3. Configure Environment Variables
1. Create a file `.env.local` in the project root (if it doesn't exist)
2. Add these lines:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```
3. Replace `your_project_url_here` and `your_anon_key_here` with the values from step 2

## 4. Create Database Table
1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste this SQL and click **Run**:

\`\`\`sql
-- Create watchlist table
create table watchlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  symbol text not null,
  company_name text not null,
  price numeric not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, symbol)
);

-- Enable Row Level Security
alter table watchlist_items enable row level security;

-- Create policies
create policy "Users can view own watchlist"
  on watchlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on watchlist_items for delete
  using (auth.uid() = user_id);
\`\`\`

## 5. Enable Google OAuth (Optional)
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. You'll need to:
   - Create a Google Cloud project
   - Enable Google+ API
   - Create OAuth credentials
   - Add authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

## 6. Restart Dev Server
After adding environment variables, restart your dev server:
\`\`\`bash
npm run dev
\`\`\`

## Done!
Your Supabase backend is now configured and ready to use.
