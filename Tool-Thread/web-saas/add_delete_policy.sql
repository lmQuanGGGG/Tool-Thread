-- Run this in Supabase SQL Editor to allow users to delete their own crawl_data
create policy "Users delete own crawl data" on crawl_data for delete using (auth.uid() = user_id);
