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
