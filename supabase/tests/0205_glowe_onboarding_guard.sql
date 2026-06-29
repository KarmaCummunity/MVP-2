-- supabase/tests/0205_glowe_onboarding_guard.sql
-- Regression for migration 0205 (FR-GLOWE-002).
--
-- glowe_profiles is owner-writable, so a malicious org could self-approve with a
-- raw PostgREST PATCH. 0205 adds a BEFORE INSERT/UPDATE guard that restricts the
-- approval_status values a CLIENT (authenticated/anon) may write to the two
-- undecided states, while letting privileged writers (admin RPC, run as a
-- non-login role) set 'approved'/'rejected'.
--
-- Runs as the `authenticated` role. Wrapped in a rolled-back transaction;
-- ON_ERROR_STOP=1 means any raise fails the CI step.

begin;

create or replace function pg_temp.mk_user(p_id uuid, p_handle text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
  values (p_id, p_handle || '@test.local', now(),
          jsonb_build_object('full_name', 'Display ' || p_handle),
          jsonb_build_object('provider', 'google'),
          'authenticated', 'authenticated');
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

-- Seed an org user + their profile row (as postgres; bypasses the guard).
do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000205a1', 'glowe_org');
  insert into public.glowe_profiles (id, display_name, account_type, approval_status, onboarding_complete)
  values ('00000000-0000-0000-0000-0000000205a1', 'Org One', 'organization', 'pending', true);
end $$;

-- Impersonate the org owner as a plain authenticated client.
select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000205a1', 'role', 'authenticated')::text,
  true
);
set local role authenticated;

-- ── BLOCKED: client self-approval / self-rejection ──
select pg_temp.expect_blocked(
  $q$update public.glowe_profiles set approval_status='approved' where id='00000000-0000-0000-0000-0000000205a1'$q$,
  'admin-managed');
select pg_temp.expect_blocked(
  $q$update public.glowe_profiles set approval_status='rejected' where id='00000000-0000-0000-0000-0000000205a1'$q$,
  'admin-managed');

-- ── ALLOWED: client edits its own org details, re-sending the same status ──
update public.glowe_profiles
   set org_description = 'We help communities', approval_status = 'pending'
 where id = '00000000-0000-0000-0000-0000000205a1';

-- ── ALLOWED: privileged approval via a non-login role (mirrors the DEFINER RPC) ──
reset role;
update public.glowe_profiles
   set approval_status = 'approved', org_reviewed_at = now()
 where id = '00000000-0000-0000-0000-0000000205a1';

-- ── BLOCKED: once approved, the client cannot downgrade it ──
select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000205a1', 'role', 'authenticated')::text,
  true
);
set local role authenticated;
select pg_temp.expect_blocked(
  $q$update public.glowe_profiles set approval_status='pending' where id='00000000-0000-0000-0000-0000000205a1'$q$,
  'admin-managed');

-- ── ALLOWED: approved org can still edit content fields (status unchanged) ──
update public.glowe_profiles
   set about = 'Updated bio', approval_status = 'approved'
 where id = '00000000-0000-0000-0000-0000000205a1';

do $$
declare v_status text;
begin
  select approval_status into v_status
    from public.glowe_profiles where id = '00000000-0000-0000-0000-0000000205a1';
  if v_status <> 'approved' then
    raise exception 'ASSERT FAILED: expected final approval_status approved, got %', v_status;
  end if;
  raise notice '✓ 0205: client self-approval blocked; admin approval + content edits allowed';
end $$;

reset role;
rollback;

\echo '✓ 0205 glowe onboarding approval-guard regression test passed'
