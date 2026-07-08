-- Thêm bảng usage_stats vào publication realtime để Frontend có thể update theo thời gian thực
begin;
  -- Bỏ qua lỗi nếu bảng đã có trong publication
  do $$ 
  begin 
    alter publication supabase_realtime add table public.usage_stats;
  exception when duplicate_object then 
    null;
  end $$;
commit;
begin;
  do $$ 
  begin 
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then 
    null;
  end $$;
commit;
