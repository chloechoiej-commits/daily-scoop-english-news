create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ko text not null default '',
  category text not null default '세상',
  source text not null,
  source_url text not null default '',
  published_at date not null default current_date,
  reading_minutes integer not null default 4 check (reading_minutes > 0),
  level text not null default 'LEVEL 2',
  cover_color text not null default 'sage',
  excerpt text not null default '',
  content text not null,
  summary text not null default '',
  words jsonb not null default '[]'::jsonb,
  grammar jsonb not null default '[]'::jsonb,
  content_kind text not null default 'manual' check (content_kind in ('manual', 'rss_excerpt', 'ai_generated')),
  collection_day date,
  created_at timestamptz not null default now()
);

create unique index if not exists articles_rss_source_url_unique on public.articles (source_url) where collection_day is not null;

alter table public.articles enable row level security;
create policy "Articles are publicly readable" on public.articles for select to anon, authenticated using (true);
-- Create teacher accounts in Supabase Auth and keep public sign-ups disabled.
create policy "Authenticated teachers can add articles" on public.articles for insert to authenticated with check (true);
