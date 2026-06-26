-- 0205_glowe_onboarding — GloWe post-sign-in onboarding & account type (FR-GLOWE-002).
--
-- After a Google sign-in, GloWe invites the user through a short onboarding:
-- basic personal details + an account-type choice (private individual vs
-- organization). Private individuals get immediate full access. Organizations
-- must submit extended details and are held at view-only until a KC admin
-- approves them (the approval RPC + admin UI land in a follow-up PR — this
-- migration only adds the columns and the client-write guard so the data model
-- is sound from the start).
--
-- Mapped to spec: FR-GLOWE-002 (post-sign-in onboarding & account type),
--   docs/SSOT/spec/17_glowe_frontend.md. Decision: D-61.

set search_path = public;

-- ── 1. Columns ──────────────────────────────────────────────────────────────
alter table public.glowe_profiles
  add column if not exists account_type        text,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists approval_status     text not null default 'not_required',
  -- Organization application fields (null for individuals).
  add column if not exists org_name                text,
  add column if not exists org_website             text,
  add column if not exists org_registration_number text,
  add column if not exists org_country             text,
  add column if not exists org_field               text,
  add column if not exists org_description         text,
  add column if not exists org_contact_name        text,
  add column if not exists org_contact_email       text,
  add column if not exists org_contact_phone       text,
  add column if not exists org_size                text,
  add column if not exists org_submitted_at        timestamptz,
  add column if not exists org_reviewed_at         timestamptz,
  add column if not exists org_reviewed_by         uuid references auth.users(id) on delete set null,
  add column if not exists org_review_note         text;

-- Constrain the enumerated columns (idempotent: drop + re-add).
alter table public.glowe_profiles
  drop constraint if exists glowe_profiles_account_type_chk;
alter table public.glowe_profiles
  add constraint glowe_profiles_account_type_chk
  check (account_type is null or account_type in ('individual', 'organization'));

alter table public.glowe_profiles
  drop constraint if exists glowe_profiles_approval_status_chk;
alter table public.glowe_profiles
  add constraint glowe_profiles_approval_status_chk
  check (approval_status in ('not_required', 'pending', 'approved', 'rejected'));

-- ── 2. Client-write guard for approval_status ───────────────────────────────
-- glowe_profiles is owner-writable (RLS in 0204), so without this guard a user
-- could PATCH their own row to approval_status='approved' and bypass org review.
-- Client roles (authenticated/anon) may only self-submit: keep the current
-- value, or move between the two undecided states ('not_required' ⇄ 'pending').
-- Privileged writers (the future admin approval RPC runs SECURITY DEFINER as a
-- non-login role, so current_user is neither 'authenticated' nor 'anon') may set
-- any value — that is the only path to 'approved'/'rejected'.
create or replace function public.glowe_profiles_guard_approval()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if coalesce(new.approval_status, 'not_required') not in ('not_required', 'pending') then
        raise exception 'glowe: approval_status % is admin-managed', new.approval_status
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE'
       and new.approval_status is distinct from old.approval_status
       and not (old.approval_status in ('not_required', 'pending')
                and new.approval_status in ('not_required', 'pending')) then
      raise exception 'glowe: approval_status is admin-managed once decided'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists glowe_profiles_guard_approval on public.glowe_profiles;
create trigger glowe_profiles_guard_approval
  before insert or update on public.glowe_profiles
  for each row execute function public.glowe_profiles_guard_approval();

-- ── 3. Index for the admin review queue (pending orgs) ──────────────────────
create index if not exists glowe_profiles_pending_orgs_idx
  on public.glowe_profiles (org_submitted_at)
  where account_type = 'organization' and approval_status = 'pending';
