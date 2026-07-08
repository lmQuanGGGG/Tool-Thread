-- Thêm cột fb_posts_count vào usage_stats (phòng hờ)
alter table public.usage_stats 
  add column if not exists fb_posts_count integer default 0;

-- Thêm cột threads_posts_count vào usage_stats
alter table public.usage_stats 
  add column if not exists threads_posts_count integer default 0;

-- Thêm cột threads_post_per_day vào tier_limits
alter table public.tier_limits 
  add column if not exists threads_post_per_day integer default 0;

-- Cập nhật lại giới hạn Threads Post cho các gói
update public.tier_limits set threads_post_per_day = 2 where tier = 'free';
update public.tier_limits set threads_post_per_day = 3 where tier = 'lite';
update public.tier_limits set threads_post_per_day = 6 where tier = 'plus';
update public.tier_limits set threads_post_per_day = 12 where tier = 'pro';
update public.tier_limits set threads_post_per_day = 999999 where tier = 'promax';
