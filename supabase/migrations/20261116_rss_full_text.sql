-- Allow full feed articles (content_kind = 'rss_full') on existing installations.
alter table public.articles drop constraint if exists articles_content_kind_check;
alter table public.articles add constraint articles_content_kind_check check (content_kind in ('manual', 'rss_excerpt', 'rss_full', 'ai_generated'));
