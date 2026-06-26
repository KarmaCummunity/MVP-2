-- supabase/tests/0206_glowe_org_approval.sql
-- Regression for migration 0206 (FR-GLOWE-003).
--
-- glowe_set_org_approval / glowe_list_pending_orgs are SECURITY DEFINER and must
-- be callable only by a KC super_admin. This test verifies:
--   • a plain authenticated (non-admin) caller is blocked (42501 / 'forbidden')
--   • a super_admin can approve a pending org, stamping reviewer + note, and the
--     0205 client-write guard does NOT block the privileged path
--   • re-deciding an already-decided org is rejected (22023)
--   • approving a non-organization / unknown profile is rejected
--   • glowe_list_pending_orgs returns the pending queue for the admin only
--
-- Runs partly as `authenticated`. Wrapped in a rolled-back transaction;
-- ON_ERROR_STOP=1 means any raise fails the CI step.

begin;

-- Confirmed auth user + matching public.users row (handle_new_user trigger).
create or replace function pg_temp.mk_user(p_id uuid, p_handle text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
  values (p_id, p_handle || '@test.local', now(),
          jsonb_build_object('full_name', 'Display ' || p_handle),
          jsonb_build_object('provider', 'google'),
          'authenticated', 'authenticated');
  update public.users
     set share_handle = p_handle, display_name = 'Display ' || p_handle,
         account_status = 'active'
   where user_id = p_id;
end $$;

create or replace function pg_temp.expect_blocked(p_sql text, variadic p_expects text[])
returns void language plpgsql as $$
declare v_blocked boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    v_blocked := true;
    if not exists (select 1 from unnest(p_expects) e where sqlerrm like '%' || e || '%') then
      raise exception 'ASSERT FAILED: expected one of %, got: %', p_expects, sqlerrm;
    end if;
  end;
  if not v_blocked then
    raise exception 'ASSERT FAILED: statement should have been blocked: %', p_sql;
  end if;
end $$;

-- Seed: a pending org, a super_admin, and a plain (non-admin) user.
do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000206a1', 'glowe_org6');
  insert into public.glowe_profiles (id, display_name, account_type, approval_status, onboarding_complete)
  values ('00000000-0000-0000-0000-0000000206a1', 'Org Six', 'organization', 'pending', true);

  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000206ad', 'glowe_admin6');
  insert into public.admin_role_grants (user_id, role)
  values ('00000000-0000-0000-0000-0000000206ad', 'super_admin');

  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000206b1', 'glowe_rando6');
end $$;

-- ── BLOCKED: a non-admin cannot approve or list ──
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000206b1', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.expect_blocked(
  $q$select public.glowe_set_org_approval('00000000-0000-0000-0000-0000000206a1', 'approved', null)$q$,
  'forbidden');
select pg_temp.expect_blocked(
  $q$select * from public.glowe_list_pending_orgs()$q$,
  'forbidden');

-- ── ALLOWED: the super_admin sees the pending org in the queue ──
reset role;
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000206ad', 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare v_n int;
begin
  select count(*) into v_n
    from public.glowe_list_pending_orgs()
   where id = '00000000-0000-0000-0000-0000000206a1';
  if v_n <> 1 then
    raise exception 'ASSERT FAILED: admin should see 1 pending org, got %', v_n;
  end if;
end $$;

-- ── ALLOWED: super_admin approves; reviewer + note stamped, guard not tripped ──
do $$
declare v_row public.glowe_profiles;
begin
  v_row := public.glowe_set_org_approval(
    '00000000-0000-0000-0000-0000000206a1', 'approved', '  Looks legit  ');
  if v_row.approval_status <> 'approved' then
    raise exception 'ASSERT FAILED: expected approved, got %', v_row.approval_status;
  end if;
  if v_row.org_reviewed_by <> '00000000-0000-0000-0000-0000000206ad' then
    raise exception 'ASSERT FAILED: org_reviewed_by not stamped to admin';
  end if;
  if v_row.org_review_note <> 'Looks legit' then
    raise exception 'ASSERT FAILED: note should be trimmed, got "%"', v_row.org_review_note;
  end if;
  if v_row.org_reviewed_at is null then
    raise exception 'ASSERT FAILED: org_reviewed_at should be set';
  end if;
end $$;

-- ── BLOCKED: re-deciding an already-decided org ──
select pg_temp.expect_blocked(
  $q$select public.glowe_set_org_approval('00000000-0000-0000-0000-0000000206a1', 'rejected', null)$q$,
  'not pending');

-- ── BLOCKED: bad decision value, unknown profile ──
reset role;
do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000206c1', 'glowe_org6b');
  insert into public.glowe_profiles (id, display_name, account_type, approval_status, onboarding_complete)
  values ('00000000-0000-0000-0000-0000000206c1', 'Pending Two', 'organization', 'pending', true);
end $$;
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000206ad', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.expect_blocked(
  $q$select public.glowe_set_org_approval('00000000-0000-0000-0000-0000000206c1', 'maybe', null)$q$,
  'approved or rejected');
select pg_temp.expect_blocked(
  $q$select public.glowe_set_org_approval('00000000-0000-0000-0000-000000999999', 'approved', null)$q$,
  'not found');

do $$
begin
  raise notice '✓ 0206: glowe org-approval RPCs gated to super_admin; approve stamps reviewer';
end $$;

reset role;
rollback;

\echo '✓ 0206 glowe org-approval regression test passed'
