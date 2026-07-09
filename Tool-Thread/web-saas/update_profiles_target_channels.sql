-- Chạy lệnh này trong Supabase SQL Editor để thêm cột target_channels vào bảng profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_channels text;
