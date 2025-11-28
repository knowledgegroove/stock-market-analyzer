# ⚠️ IMPORTANT: Complete Supabase Setup

## You need to create the database table!

Your Supabase credentials are configured, but the **database table** hasn't been created yet. This is why the watchlist feature isn't working.

### Quick Setup (2 minutes):

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/uteglchcygpswstbhtmz/sql/new

2. **Paste and run this SQL:**

```sql
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
```

3. **Click "Run"** in the SQL Editor

4. **Test the app:**
   - Sign up with any email/password
   - Add a stock to watchlist
   - It should now work!

---

**Nofter completing this setup, the watchlist will sync to the cloud for all your devices!** 🎉
