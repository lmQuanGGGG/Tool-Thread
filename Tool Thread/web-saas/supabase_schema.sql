-- ==========================================
-- AUTO FARM MMO - SUPABASE SCHEMA SCRIPT
-- ==========================================

-- Bật UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tạo bảng profiles (Lưu cấu hình và cookie)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  -- 5 gói: free (bấm tay, giới hạn nhiều) -> lite -> plus -> pro -> promax (auto, không giới hạn)
  tier text default 'free' check (tier in ('free', 'lite', 'plus', 'pro', 'promax')),
  fb_cookie text,
  threads_cookie text,
  affiliate_links text,
  tele_chat_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS cho profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Tạo bảng usage_stats (Thống kê & Giới hạn)
create table public.usage_stats (
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  reels_posted integer default 0,
  threads_commented integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, date)
);

-- Enable RLS cho usage_stats
alter table public.usage_stats enable row level security;
create policy "Users can view own stats" on usage_stats for select using (auth.uid() = user_id);
-- Chỉ backend (Service Role) mới được quyền update usage_stats để tránh hack

-- 3. Tạo bảng transactions (Lịch sử thanh toán PayOS)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  order_code bigint not null unique,
  status text default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS cho transactions
alter table public.transactions enable row level security;
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);

-- ==========================================
-- TỰ ĐỘNG TẠO PROFILE KHI CÓ USER ĐĂNG KÝ
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, tier)
  values (new.id, new.email, 'free');
  return new;
end;
$$ language plpgsql security definer;

-- Gắn Trigger vào bảng auth.users của Supabase
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- BẢNG GIỚI HẠN THEO GÓI (TIER LIMITS)
-- ==========================================
create table public.tier_limits (
  tier text primary key,
  -- Tự động chạy theo lịch (true) hay phải bấm tay (false)
  auto_run boolean default false,
  -- Số Reels được đăng mỗi ngày (-1 = không giới hạn)
  reels_per_day integer default 0,
  -- Số bài Threads Comment mỗi ngày (-1 = không giới hạn)
  threads_per_day integer default 0,
  -- Số lần đăng FB Story mỗi ngày (-1 = không giới hạn)
  fb_story_per_day integer default 0,
  -- Số link affiliate tối đa được lưu
  max_links integer default 1,
  -- Có nhận thông báo Telegram không
  telegram_notify boolean default false,
  -- Giá tiền (VND/tháng)
  price_vnd integer default 0
);

-- Nhập dữ liệu giới hạn mặc định cho 5 gói
insert into public.tier_limits (tier, auto_run, reels_per_day, threads_per_day, fb_story_per_day, max_links, telegram_notify, price_vnd) values
  ('free',    false,  1,   10,  0,   1,  false,  0),
  ('lite',    false,  2,   30,  1,   3,  true,   99000),
  ('plus',    true,   4,   80,  2,   10, true,   199000),
  ('pro',     true,   6,   150, 5,   20, true,   399000),
  ('promax',  true,  -1,   -1, -1,  -1,  true,   699000);

-- Enable RLS cho tier_limits (Public read, chỉ Admin mới được update)
alter table public.tier_limits enable row level security;
create policy "Public can view tier limits" on tier_limits for select using (true);
