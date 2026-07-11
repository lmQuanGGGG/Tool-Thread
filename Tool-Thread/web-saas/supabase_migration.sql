-- ==========================================
-- MIGRATION SCRIPT - CẬP NHẬT SCHEMA
-- Chạy script này vào SQL Editor của Supabase
-- ==========================================

-- BƯỚC 1: Mở rộng ràng buộc tier từ ('free','pro') -> 5 gói mới
alter table public.profiles 
  drop constraint if exists profiles_tier_check;

alter table public.profiles 
  add constraint profiles_tier_check 
  check (tier in ('free', 'lite', 'plus', 'pro', 'promax'));

-- BƯỚC 2: Tạo bảng tier_limits để quản lý giới hạn tập trung
create table if not exists public.tier_limits (
  tier text primary key,
  auto_run boolean default false,
  reels_per_day integer default 0,
  threads_per_day integer default 0,
  fb_post_per_day integer default 0,
  threads_post_per_day integer default 0,
  crawl_per_day integer default 0,
  max_links integer default 1,
  telegram_notify boolean default false,
  price_vnd integer default 0
);

-- BƯỚC 3: Nhập dữ liệu mặc định cho 5 gói
insert into public.tier_limits 
  (tier, auto_run, reels_per_day, threads_per_day, fb_post_per_day, threads_post_per_day, crawl_per_day, max_links, telegram_notify, price_vnd) 
values
  ('free',    false,  2,   10,  1,   2,   1,   4,   false,  0),
  ('lite',    false,  3,   30,  3,   3,   2,   8,   false,  59000),
  ('plus',    true,   6,   80,  5,   6,   3,   20,  true,   129000),
  ('pro',     true,   12,  160, 10,  12,  4,   100, true,   199000),
  ('promax',  true,  -1,   -1,  -1,  -1,  -1,  -1,  true,   499000)
on conflict (tier) do update set
  auto_run = excluded.auto_run,
  reels_per_day = excluded.reels_per_day,
  threads_per_day = excluded.threads_per_day,
  fb_post_per_day = excluded.fb_post_per_day,
  threads_post_per_day = excluded.threads_post_per_day,
  crawl_per_day = excluded.crawl_per_day,
  max_links = excluded.max_links,
  telegram_notify = excluded.telegram_notify,
  price_vnd = excluded.price_vnd;

-- BƯỚC 4: Enable RLS + Policy public read cho tier_limits
alter table public.tier_limits enable row level security;

-- CREATE POLICY không hỗ trợ IF NOT EXISTS, dùng DO block để tránh lỗi duplicate
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'tier_limits' and policyname = 'Public can view tier limits'
  ) then
    execute 'create policy "Public can view tier limits" on tier_limits for select using (true)';
  end if;
end $$;

-- BƯỚC 5: Thêm cột fb_posts vào bảng thống kê (nếu chưa có)
alter table public.usage_stats 
  add column if not exists fb_posts_count integer default 0;

-- Xong! Kiểm tra kết quả:
-- select * from tier_limits;

-- ==========================================
-- MIGRATION V2 - CRAWL & POST SYSTEM
-- ==========================================

-- BƯỚC 6: Thêm columns mới vào profiles
alter table public.profiles
  add column if not exists credits integer default 0,
  add column if not exists video_sources text default '',        -- Mỗi dòng 1 URL kênh (YT, TikTok, IG...)
  add column if not exists caption_template text default '{title}
#reels #phimhay #giaitri
👉 Link mua hàng: {link}';  -- Template caption với {title}, {link} placeholder

-- BƯỚC 7: Tạo bảng crawl_jobs (quản lý job crawl)
create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  url text not null,                              -- URL Threads/profile cần crawl
  status text default 'pending'
    check (status in ('pending','running','done','error')),
  total_posts integer default 0,                  -- Số bài đã crawl được
  credits_used integer default 0,                 -- Tổng credit đã tiêu
  error_msg text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index tìm nhanh jobs theo user
create index if not exists crawl_jobs_user_id_idx on public.crawl_jobs(user_id);
create index if not exists crawl_jobs_status_idx on public.crawl_jobs(status);

-- BƯỚC 8: Tạo bảng crawl_data (data đã crawl được)
create table if not exists public.crawl_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.crawl_jobs(id) on delete cascade,
  post_id text,                                   -- ID bài viết để chống trùng
  source_url text,                                -- URL bài gốc
  text_content text,                              -- Nội dung text bài viết
  image_file_ids text[] default '{}',             -- Array file_id Telegram (đã upload)
  image_urls text[] default '{}',                 -- URL ảnh gốc (backup)
  posted boolean default false,                   -- Đã đăng lên Threads chưa
  posted_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, post_id)                        -- Rất quan trọng để upsert không bị lỗi
);

-- Index tìm nhanh data chưa đăng
create index if not exists crawl_data_user_posted_idx on public.crawl_data(user_id, posted);
create index if not exists crawl_data_job_id_idx on public.crawl_data(job_id);

-- BƯỚC 9: Tạo bảng credit_transactions (audit log nạp/tiêu credit)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,                        -- Dương = nạp, Âm = tiêu
  type text not null
    check (type in ('topup','crawl','post','storage','refund')),
  description text,
  ref_id uuid,                                    -- job_id hoặc payment_id liên quan
  created_at timestamptz default now()
);

create index if not exists credit_tx_user_id_idx on public.credit_transactions(user_id);

-- BƯỚC 10: Enable RLS cho các bảng mới
alter table public.crawl_jobs enable row level security;
alter table public.crawl_data enable row level security;
alter table public.credit_transactions enable row level security;

-- RLS Policies: user chỉ xem được data của chính mình
do $$
begin
  -- crawl_jobs policies
  if not exists (select 1 from pg_policies where tablename = 'crawl_jobs' and policyname = 'Users view own crawl jobs') then
    execute 'create policy "Users view own crawl jobs" on crawl_jobs for select using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'crawl_jobs' and policyname = 'Users insert own crawl jobs') then
    execute 'create policy "Users insert own crawl jobs" on crawl_jobs for insert with check (auth.uid() = user_id)';
  end if;

  -- crawl_data policies
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users view own crawl data') then
    execute 'create policy "Users view own crawl data" on crawl_data for select using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users insert own crawl data') then
    execute 'create policy "Users insert own crawl data" on crawl_data for insert with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users update own crawl data') then
    execute 'create policy "Users update own crawl data" on crawl_data for update using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'crawl_data' and policyname = 'Users delete own crawl data') then
    execute 'create policy "Users delete own crawl data" on crawl_data for delete using (auth.uid() = user_id)';
  end if;

  -- credit_transactions policies
  if not exists (select 1 from pg_policies where tablename = 'credit_transactions' and policyname = 'Users view own transactions') then
    execute 'create policy "Users view own transactions" on credit_transactions for select using (auth.uid() = user_id)';
  end if;
end $$;

-- BƯỚC 11: Function tự động trừ/cộng credit an toàn (atomic)
create or replace function public.adjust_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_ref_id uuid default null
)
returns integer  -- trả về số credit sau khi điều chỉnh
language plpgsql security definer as $$
declare
  v_current integer;
  v_new integer;
begin
  -- Lock row để tránh race condition
  select credits into v_current from profiles where id = p_user_id for update;
  
  v_new := v_current + p_amount;
  
  -- Không cho âm credit
  if v_new < 0 then
    raise exception 'Insufficient credits: have %, need %', v_current, abs(p_amount);
  end if;
  
  -- Cập nhật credit
  update profiles set credits = v_new where id = p_user_id;
  
  -- Ghi audit log
  insert into credit_transactions(user_id, amount, type, description, ref_id)
  values (p_user_id, p_amount, p_type, p_description, p_ref_id);
  
  return v_new;
end;
$$;

-- Xong V2! Kiểm tra:
-- select id, email, tier, credits from profiles;
-- select * from crawl_jobs limit 10;
-- select * from crawl_data limit 10;

create table public.bot_logs (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  bot_type text not null,
  message text not null,
  level text default 'info',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bot_logs enable row level security;
create policy "Users can view own logs" on bot_logs for select using (
  auth.uid() in (select id from profiles where profiles.email = bot_logs.email)
);

-- ==========================================
-- MIGRATION V5 - FB COMMENT QUOTA
-- ==========================================

-- Thêm cột đếm số phiên Comment FB rải link vào bảng usage_stats
alter table public.usage_stats
  add column if not exists fb_comments_count integer default 0;
