-- 0209_glowe_admin_role — Add glowe_admin role to admin_role_grants + seed.
--
-- handle_new_user() already creates a public.users row for every auth.users
-- entry (including Google OAuth from GLOWE), so admin_role_grants is usable
-- for GLOWE-only accounts without any extra table.
--
-- This migration:
--   1. Extends the role check constraint to include 'glowe_admin'.
--   2. Adds is_glowe_admin(uid) — internal DB predicate (glowe_admin OR super_admin).
--   3. Adds an AFTER INSERT trigger on public.users that auto-grants glowe_admin
--      to the two named primary-admin emails.
--   4. Backfills existing public.users rows for those emails.
--   5. Updates glowe_set_org_approval and glowe_list_pending_orgs to use
--      is_glowe_admin instead of admin_assert_role(['super_admin','moderator']),
--      so KC moderators no longer have automatic GLOWE admin access.
--
-- Mapped to spec: FR-GLOWE-003 (org approval workflow),
--   docs/SSOT/spec/17_glowe_frontend.md.

set search_path = public;

-- ── 1. Extend role check constraint ─────────────────────────────────────────
alter table public.admin_role_grants
  drop constraint if exists admin_role_grants_role_check;

alter table public.admin_role_grants
  add constraint admin_role_grants_role_check
  check (role in (
    'super_admin', 'moderator', 'support',
    'operator', 'operators_manager',
    'org_admin', 'org_manager', 'org_employee',
    'volunteer_manager', 'org_volunteer',
    'glowe_admin'
  ));

-- ── 2. is_glowe_admin predicate (internal — no grant to authenticated) ───────
create or replace function public.is_glowe_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_admin_role(uid, 'glowe_admin')
      or public.has_admin_role(uid, 'super_admin');
$$;

comment on function public.is_glowe_admin(uuid) is
  'Returns true if uid holds glowe_admin or super_admin in admin_role_grants.';

-- ── 3. Auto-grant trigger on public.users ───────────────────────────────────
-- Fires after handle_new_user() creates the public.users row.
create or replace function public._glowe_admin_auto_grant()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (select email from auth.users where id = new.user_id) = any (array[
    'michal.foux97@gmail.com',
    'karmacommunity2.0@gmail.com'
  ]) then
    if not exists (
      select 1 from public.admin_role_grants
       where user_id = new.user_id
         and role = 'glowe_admin'
         and revoked_at is null
    ) then
      insert into public.admin_role_grants (user_id, role)
      values (new.user_id, 'glowe_admin');
    end if;
  end if;
  return new;
end;
$$;

comment on function public._glowe_admin_auto_grant() is
  'Trigger: grants glowe_admin role on public.users INSERT for named primary-admin emails.';

drop trigger if exists users_after_insert_glowe_admin_grant on public.users;
create trigger users_after_insert_glowe_admin_grant
  after insert on public.users
  for each row execute function public._glowe_admin_auto_grant();

-- ── 4. Backfill: existing public.users rows for the named emails ─────────────
insert into public.admin_role_grants (user_id, role)
select u.user_id, 'glowe_admin'
from public.users u
join auth.users au on au.id = u.user_id
where au.email = any (array[
  'michal.foux97@gmail.com',
  'karmacommunity2.0@gmail.com'
])
  and not exists (
    select 1 from public.admin_role_grants
     where user_id = u.user_id
       and role = 'glowe_admin'
       and revoked_at is null
  );

-- ── 5. Update glowe_set_org_approval to use is_glowe_admin ──────────────────
create or replace function public.glowe_set_org_approval(
  p_profile_id uuid,
  p_decision   text,
  p_note       text default null
)
returns public.glowe_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row   public.glowe_profiles;
begin
  if not public.is_glowe_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'glowe: decision must be approved or rejected, got %', p_decision
      using errcode = '22023';
  end if;

  select * into v_row
    from public.glowe_profiles
   where id = p_profile_id
   for update;
  if not found then
    raise exception 'glowe: profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if v_row.account_type is distinct from 'organization' then
    raise exception 'glowe: profile % is not an organization', p_profile_id
      using errcode = '22023';
  end if;
  if v_row.approval_status <> 'pending' then
    raise exception 'glowe: profile % is not pending (currently %)',
      p_profile_id, v_row.approval_status using errcode = '22023';
  end if;

  update public.glowe_profiles
     set approval_status = p_decision,
         org_reviewed_at = now(),
         org_reviewed_by = v_actor,
         org_review_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_profile_id
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.glowe_set_org_approval(uuid, text, text) is
  'GLOWE admins only: approve/reject a pending GloWe organization. Raises 42501 for non-admins.';

revoke execute on function public.glowe_set_org_approval(uuid, text, text) from public;
grant  execute on function public.glowe_set_org_approval(uuid, text, text) to authenticated;

-- ── 6. Update glowe_list_pending_orgs to use is_glowe_admin ─────────────────
create or replace function public.glowe_list_pending_orgs()
returns setof public.glowe_profiles
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_glowe_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select *
      from public.glowe_profiles
     where account_type = 'organization'
       and approval_status = 'pending'
     order by org_submitted_at asc nulls last;
end;
$$;

comment on function public.glowe_list_pending_orgs() is
  'GLOWE admins only: organizations awaiting review (approval_status=pending).';

revoke execute on function public.glowe_list_pending_orgs() from public;
grant  execute on function public.glowe_list_pending_orgs() to authenticated;
