create table if not exists public.fb_session_locks (
  email text primary key,
  holder text not null,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create or replace function public.acquire_fb_session_lock(
  p_email text,
  p_holder text,
  p_ttl_seconds integer default 7200
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  acquired boolean;
begin
  insert into public.fb_session_locks (email, holder, locked_at, expires_at)
  values (p_email, p_holder, now(), now() + make_interval(secs => p_ttl_seconds))
  on conflict (email) do update
    set holder = excluded.holder,
        locked_at = excluded.locked_at,
        expires_at = excluded.expires_at
    where public.fb_session_locks.expires_at <= now()
  returning true into acquired;

  return coalesce(acquired, false);
end;
$$;

create or replace function public.release_fb_session_lock(p_email text, p_holder text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.fb_session_locks where email = p_email and holder = p_holder;
  return found;
end;
$$;

revoke all on public.fb_session_locks from anon, authenticated;
revoke all on function public.acquire_fb_session_lock(text, text, integer) from public;
revoke all on function public.release_fb_session_lock(text, text) from public;
grant execute on function public.acquire_fb_session_lock(text, text, integer) to service_role;
grant execute on function public.release_fb_session_lock(text, text) to service_role;
