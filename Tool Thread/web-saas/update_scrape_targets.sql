-- ==========================================
-- UPDATE SCRIPT: Cào Profile Threads Tự Động
-- Chạy script này trong Supabase SQL Editor
-- ==========================================

-- 1. Thêm cột target vào bảng profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS threads_scrape_targets text;

-- 2. Tạo bảng lưu trữ bài cào
CREATE TABLE IF NOT EXISTS public.scraped_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL, -- Email của chủ sở hữu cào bài này
  platform text DEFAULT 'threads', -- threads, instagram, etc
  post_id text NOT NULL, -- ID bài đăng gốc
  post_url text,
  timestamp bigint,
  author jsonb, -- { username, full_name, avatar_url, is_verified }
  content text, -- Nội dung chữ
  media jsonb, -- Mảng chứa media { type, url, file_id } (file_id từ telegram)
  stats jsonb, -- { likes, replies, reposts, quotes }
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_email, platform, post_id) -- Tránh lưu trùng bài
);

-- Bật RLS
ALTER TABLE public.scraped_posts ENABLE ROW LEVEL SECURITY;

-- Policy cho phép user tự xem data của mình
CREATE POLICY "Users can view own scraped posts" ON scraped_posts FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE profiles.email = scraped_posts.user_email)
);

-- Backend service role (như PM2 hoặc Github Actions) có thể Bypass RLS để INSERT/UPDATE
