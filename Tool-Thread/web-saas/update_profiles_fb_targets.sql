-- Danh sách Group/Page Facebook riêng cho từng tài khoản.
-- Mỗi dòng một URL, cấu hình từ trang Accounts trên web (tối đa 17 mục).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fb_targets text NOT NULL DEFAULT '';
