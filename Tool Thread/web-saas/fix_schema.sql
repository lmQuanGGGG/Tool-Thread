-- CHẠY TOÀN BỘ ĐOẠN NÀY ĐỂ FIX LỖI 0 BÀI:

-- 1. Thêm cột post_id chống trùng (nếu chưa có)
alter table public.crawl_data add column if not exists post_id text;

-- 2. Thêm khóa phụ (user_id, post_id)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crawl_data_user_id_post_id_key') then
    alter table public.crawl_data add constraint crawl_data_user_id_post_id_key unique (user_id, post_id);
  end if;
end $$;

-- 3. THÊM QUYỀN (RLS) CHO PHÉP USER INSERT & UPDATE CRAWL_DATA
do $$
begin
  -- Cho phép người dùng thêm bài (Insert)
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users insert own crawl data') then
    execute 'create policy "Users insert own crawl data" on crawl_data for insert with check (auth.uid() = user_id)';
  end if;

  -- Cho phép người dùng cập nhật bài (Update - dùng cho upsert)
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users update own crawl data') then
    execute 'create policy "Users update own crawl data" on crawl_data for update using (auth.uid() = user_id)';
  end if;
end $$;
