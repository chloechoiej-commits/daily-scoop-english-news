create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.teacher_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.teacher_users enable row level security;
revoke all on private.teacher_users from public, anon, authenticated;
create or replace function public.is_article_teacher()
returns boolean language sql stable security definer set search_path = pg_catalog, private as $$
  select (auth.jwt() ->> 'is_anonymous') = 'false'
    and exists (select 1 from private.teacher_users where user_id = auth.uid());
$$;
revoke all on function public.is_article_teacher() from public, anon;
grant execute on function public.is_article_teacher() to authenticated;

-- Apply before enabling anonymous sign-ins or any public sign-ups.
drop policy if exists "Authenticated teachers can add articles" on public.articles;
create policy "Authenticated teachers can add articles" on public.articles
  for insert to authenticated with check (public.is_article_teacher());

create table if not exists private.summary_feedback_requests (
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists summary_feedback_requests_created_at on private.summary_feedback_requests (created_at);
create index if not exists summary_feedback_requests_user_created on private.summary_feedback_requests (user_id, created_at);
alter table private.summary_feedback_requests enable row level security;
revoke all on private.summary_feedback_requests from public, anon, authenticated;

-- Both checks and the reservation happen under a transaction lock. No request text is stored.
create or replace function public.reserve_summary_feedback(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, private as $$
begin
  if p_user_id is null then return false; end if;
  perform pg_advisory_xact_lock(7893214);
  delete from private.summary_feedback_requests where created_at < now() - interval '2 days';
  if (select count(*) from private.summary_feedback_requests where user_id = p_user_id and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from private.summary_feedback_requests where created_at > now() - interval '1 day') >= 250 then
    return false;
  end if;
  insert into private.summary_feedback_requests (user_id) values (p_user_id);
  return true;
end;
$$;
revoke all on function public.reserve_summary_feedback(uuid) from public, anon, authenticated;
grant execute on function public.reserve_summary_feedback(uuid) to service_role;
