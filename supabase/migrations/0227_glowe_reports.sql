-- 0227_glowe_reports — GloWe moderation & reporting (FR-GLOWE-015).
--
-- Lightweight content moderation for the GloWe frontend: any signed-in member
-- can flag a post / opportunity / profile / comment / thread / reply once; KC
-- GLOWE admins (glowe_admin or super_admin, migration 0209) review the queue on
-- the GloWe Admin page and either dismiss the report or remove the content.
--
-- Content removal is soft: glowe_posts.status / glowe_opportunities.status move
-- to 'removed' (CHECK constraints widened below) and every public listing
-- excludes that status. Removal runs through a SECURITY DEFINER RPC so the
-- owner-write RLS on the content tables is not loosened for admins.
--
-- Mapped to spec: FR-GLOWE-015 (spec/17_glowe_frontend.md).

set search_path = public;

-- ── 1. Widen content CHECKs ──────────────────────────────────────────────────
-- status: + 'removed' (moderation). post_type: + 'offer' (FR-GLOWE-016 — an
-- individual's standing volunteer-offer post, surfaced on the Wishing Well).
alter table public.glowe_posts drop constraint if exists glowe_posts_post_type_chk;
alter table public.glowe_posts
  add constraint glowe_posts_post_type_chk
  check (post_type in ('wish', 'community', 'outreach', 'offer'));

alter table public.glowe_posts drop constraint if exists glowe_posts_status_chk;
alter table public.glowe_posts
  add constraint glowe_posts_status_chk
  check (status in ('open', 'fulfilled', 'sent', 'removed'));

alter table public.glowe_opportunities drop constraint if exists glowe_opp_status_chk;
alter table public.glowe_opportunities
  add constraint glowe_opp_status_chk
  check (status in ('active', 'cancelled', 'closed', 'removed'));

-- ── 2. Reports table ─────────────────────────────────────────────────────────
create table if not exists public.glowe_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id   text not null,
  reason      text not null,
  note        text,
  status      text not null default 'open',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id),
  constraint glowe_reports_target_type_chk
    check (target_type in ('post', 'opportunity', 'profile', 'comment', 'thread', 'reply', 'general')),
  constraint glowe_reports_reason_chk
    check (reason in ('spam', 'harassment', 'misinformation', 'inappropriate_content', 'fake_profile', 'other')),
  constraint glowe_reports_status_chk
    check (status in ('open', 'dismissed', 'actioned'))
);

create index if not exists glowe_reports_open_idx
  on public.glowe_reports (created_at)
  where status = 'open';

alter table public.glowe_reports enable row level security;

-- Reporter: insert own report (status/reviewer columns keep their defaults via
-- the column-level guard trigger below) and read own reports back.
drop policy if exists "glowe reports insert own" on public.glowe_reports;
create policy "glowe reports insert own" on public.glowe_reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "glowe reports read own" on public.glowe_reports;
create policy "glowe reports read own" on public.glowe_reports
  for select to authenticated
  using ((select auth.uid()) = reporter_id);

-- Client roles must not pre-set review columns (mirrors the 0205 approval guard).
create or replace function public.glowe_reports_guard_client()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.status is distinct from 'open'
       or new.reviewed_by is not null
       or new.reviewed_at is not null then
      raise exception 'glowe: report review fields are server-managed'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists glowe_reports_guard_client_trg on public.glowe_reports;
create trigger glowe_reports_guard_client_trg
  before insert or update on public.glowe_reports
  for each row execute function public.glowe_reports_guard_client();

-- ── 3. Admin queue RPC ───────────────────────────────────────────────────────
-- Reports enriched with the reporter's GloWe display name; GLOWE admins only.
create or replace function public.glowe_admin_list_reports()
returns table (
  id            uuid,
  reporter_id   uuid,
  reporter_name text,
  target_type   text,
  target_id     text,
  reason        text,
  note          text,
  status        text,
  reviewed_at   timestamptz,
  created_at    timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_glowe_admin(auth.uid()) then
    raise exception 'glowe: forbidden' using errcode = '42501';
  end if;

  return query
    select r.id, r.reporter_id,
           coalesce(p.display_name, '') as reporter_name,
           r.target_type, r.target_id, r.reason, r.note, r.status,
           r.reviewed_at, r.created_at
      from public.glowe_reports r
      left join public.glowe_profiles p on p.id = r.reporter_id
     order by (r.status = 'open') desc, r.created_at desc;
end;
$$;

comment on function public.glowe_admin_list_reports() is
  'GLOWE admins only (glowe_admin/super_admin): moderation report queue, open first.';

revoke execute on function public.glowe_admin_list_reports() from public;
grant  execute on function public.glowe_admin_list_reports() to authenticated;

-- ── 4. Dismiss a report ──────────────────────────────────────────────────────
create or replace function public.glowe_admin_dismiss_report(p_report_id uuid)
returns public.glowe_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.glowe_reports;
begin
  if not public.is_glowe_admin(auth.uid()) then
    raise exception 'glowe: forbidden' using errcode = '42501';
  end if;

  select * into v_row from public.glowe_reports where id = p_report_id for update;
  if not found then
    raise exception 'glowe: report % not found', p_report_id using errcode = 'P0002';
  end if;
  if v_row.status <> 'open' then
    raise exception 'glowe: report % already reviewed (%)', p_report_id, v_row.status
      using errcode = '22023';
  end if;

  update public.glowe_reports
     set status = 'dismissed', reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_report_id
  returning * into v_row;
  return v_row;
end;
$$;

comment on function public.glowe_admin_dismiss_report(uuid) is
  'GLOWE admins only: dismiss an open moderation report.';

revoke execute on function public.glowe_admin_dismiss_report(uuid) from public;
grant  execute on function public.glowe_admin_dismiss_report(uuid) to authenticated;

-- ── 5. Remove reported content ───────────────────────────────────────────────
-- Soft-removes the target (status='removed') and marks the report actioned,
-- atomically. Only posts and opportunities are removable in MVP (spec AC5);
-- other target types can only be dismissed.
create or replace function public.glowe_admin_remove_content(
  p_type      text,
  p_id        text,
  p_report_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_touched integer := 0;
begin
  if not public.is_glowe_admin(auth.uid()) then
    raise exception 'glowe: forbidden' using errcode = '42501';
  end if;

  if p_type = 'post' then
    update public.glowe_posts set status = 'removed' where id = p_id;
    get diagnostics v_touched = row_count;
  elsif p_type = 'opportunity' then
    update public.glowe_opportunities set status = 'removed' where id = p_id;
    get diagnostics v_touched = row_count;
  else
    raise exception 'glowe: cannot remove target type %', p_type using errcode = '22023';
  end if;

  if v_touched = 0 then
    raise exception 'glowe: % % not found', p_type, p_id using errcode = 'P0002';
  end if;

  if p_report_id is not null then
    update public.glowe_reports
       set status = 'actioned', reviewed_by = auth.uid(), reviewed_at = now()
     where id = p_report_id and status = 'open';
  end if;
end;
$$;

comment on function public.glowe_admin_remove_content(text, text, uuid) is
  'GLOWE admins only: soft-remove a reported GloWe post/opportunity and action the report.';

revoke execute on function public.glowe_admin_remove_content(text, text, uuid) from public;
grant  execute on function public.glowe_admin_remove_content(text, text, uuid) to authenticated;
