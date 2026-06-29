-- 0211_glowe_events — Event publishing & RSVP foundation (additive model).
--
-- Extends FR-GLOWE-007 (Volunteer Network / opportunities) and FR-GLOWE-012
-- (Applications inbox) rather than introducing parallel event tables. Per the
-- GloWe convergence direction (member-experience design, D-61): an Event is an
-- opportunity that carries a date (`start_at`) and event metadata; an RSVP is a
-- `glowe_applications` row. No new tables, no schema subtype — events ride the
-- existing read/write/RLS paths and gain only additive, backward-compatible
-- columns plus a status guard so applicants cannot self-decide their own status.
--
-- Mapped to spec: FR-GLOWE-007 (events extend opportunities),
--   FR-GLOWE-012 (registration lifecycle). Design:
--   docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md.

set search_path = public;

-- ── 1. Event metadata on opportunities ──────────────────────────────────────
-- All columns are nullable or defaulted, so existing opportunity rows and every
-- current client INSERT stay valid. A plain opportunity has start_at IS NULL.
alter table public.glowe_opportunities
  add column if not exists start_at          timestamptz,
  add column if not exists end_at            timestamptz,
  add column if not exists event_type        text,
  add column if not exists event_link        text,
  add column if not exists link_visibility   text not null default 'immediate',
  add column if not exists link_reveal_hours int,
  add column if not exists capacity          int,
  add column if not exists registration_mode text not null default 'gated',
  add column if not exists status            text not null default 'active';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_event_type_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_event_type_chk
      check (event_type is null or event_type in ('physical', 'digital'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_link_visibility_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_link_visibility_chk
      check (link_visibility in ('immediate', 'before_event'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_registration_mode_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_registration_mode_chk
      check (registration_mode in ('open', 'gated'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_status_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_status_chk
      check (status in ('active', 'cancelled', 'closed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_capacity_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_capacity_chk
      check (capacity is null or capacity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_opp_event_window_chk') then
    alter table public.glowe_opportunities add constraint glowe_opp_event_window_chk
      check (start_at is null or end_at is null or end_at >= start_at);
  end if;
end $$;

-- ── 2. Registration lifecycle on applications ───────────────────────────────
alter table public.glowe_applications
  add column if not exists submitted_email   text,
  add column if not exists submitted_phone   text,
  add column if not exists submitted_comment text,
  add column if not exists waitlist_position int,
  add column if not exists rejection_note    text,
  add column if not exists decided_at        timestamptz,
  add column if not exists decided_by        uuid references auth.users(id) on delete set null;

-- NOT VALID: do not retro-scan legacy rows, but enforce the set on every new
-- write. The existing default ('Pending') already sits inside the allowed set.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'glowe_applications_status_chk') then
    alter table public.glowe_applications add constraint glowe_applications_status_chk
      check (status in ('Pending', 'Accepted', 'Declined', 'Waitlisted', 'Cancelled')) not valid;
  end if;
end $$;

-- One active registration per (opportunity, user). Cancelled/Declined rows are
-- excluded so a user may re-register after cancelling or being declined.
create unique index if not exists glowe_applications_active_uniq
  on public.glowe_applications (opportunity_id, user_id)
  where status not in ('Cancelled', 'Declined');

-- ── 3. Status guard — applicants cannot self-decide ─────────────────────────
-- SECURITY INVOKER: privileged writers (SECURITY DEFINER RPCs added in later
-- slices) run as the function owner, so current_user is neither 'authenticated'
-- nor 'anon' and they bypass the guard. Mirrors migration 0199 (posts guard).
create or replace function public.glowe_applications_guard_status()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;  -- privileged server-side path (DEFINER RPCs)
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'Pending' then
      raise exception 'forbidden: registration must start as Pending'
        using errcode = '42501';
    end if;
    if new.decided_at is not null or new.decided_by is not null
       or new.waitlist_position is not null or new.rejection_note is not null then
      raise exception 'forbidden: server-managed fields cannot be set by the client'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE: a client may only cancel their own registration.
  if new.status is distinct from old.status and new.status is distinct from 'Cancelled' then
    raise exception 'forbidden: clients may only cancel a registration'
      using errcode = '42501';
  end if;
  if new.decided_at        is distinct from old.decided_at
     or new.decided_by        is distinct from old.decided_by
     or new.waitlist_position is distinct from old.waitlist_position
     or new.rejection_note    is distinct from old.rejection_note then
    raise exception 'forbidden: server-managed fields cannot be modified by the client'
      using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists glowe_applications_guard_status_trg on public.glowe_applications;
create trigger glowe_applications_guard_status_trg
  before insert or update on public.glowe_applications
  for each row execute function public.glowe_applications_guard_status();
