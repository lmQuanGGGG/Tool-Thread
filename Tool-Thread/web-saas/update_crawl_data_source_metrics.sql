-- Preserve original Threads metadata so the auto poster can choose the
-- highest-engagement source post first.
alter table public.crawl_data
  add column if not exists source_published_at timestamptz,
  add column if not exists source_likes integer not null default 0,
  add column if not exists source_replies integer not null default 0,
  add column if not exists source_reposts integer not null default 0,
  add column if not exists source_quotes integer not null default 0,
  add column if not exists source_engagement integer not null default 0;

create index if not exists crawl_data_pending_engagement_idx
  on public.crawl_data (user_id, posted, source_engagement desc, source_published_at desc);
