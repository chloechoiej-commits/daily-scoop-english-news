-- Run this on existing installations before enabling the collector.
alter table public.articles add column if not exists content_kind text not null default 'manual';
alter table public.articles add column if not exists collection_day date;
create unique index if not exists articles_rss_source_url_unique on public.articles (source_url) where collection_day is not null;
