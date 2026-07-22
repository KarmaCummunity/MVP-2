-- supabase/tests/0232_glowe_health_checks.sql
-- Regression for migration 0232 (INFRA-QA-W7 / FR-GLOWE-018 health visibility).
--
-- Verifies:
--   • non-admin blocked on glowe_admin_health_summary / list_health_checks
--   • GLOWE admin can read an empty summary, then the latest row per check_name
--
-- Wrapped in a rolled-back transaction; ON_ERROR_STOP=1 fails CI on any raise.

begin;

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

do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-000000023201', 'member0232');
  perform pg_temp.mk_user('00000000-0000-0000-0000-000000023202', 'admin0232');
  insert into public.admin_role_grants (user_id, role)
  values ('00000000-0000-0000-0000-000000023202', 'glowe_admin');
end $$;

-- Non-admin blocked
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000023201', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.expect_blocked(
  $q$select * from public.glowe_admin_health_summary()$q$,
  'forbidden');
select pg_temp.expect_blocked(
  $q$select * from public.glowe_admin_list_health_checks(10)$q$,
  'forbidden');

-- Admin reads empty summary before probes land
reset role;
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000023202', 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.glowe_admin_health_summary();
  if v_n <> 0 then
    raise exception 'ASSERT FAILED: summary should be empty, got % rows', v_n;
  end if;
end $$;

-- Service-role insert (superuser in migration test harness)
reset role;
insert into public.glowe_health_checks (run_id, check_name, status, latency_ms, app_version, environment, checked_at)
values
  ('run-0232-a', 'home_load', 'ok', 120, '1.0.13', 'glowe_prod', now() - interval '2 minutes'),
  ('run-0232-b', 'home_load', 'fail', 9000, '1.0.13', 'glowe_prod', now());

update public.glowe_health_checks
   set error_code = 'timeout',
       error_detail = 'page did not load'
 where run_id = 'run-0232-b';

select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000023202', 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare v_status text;
begin
  select status into v_status
    from public.glowe_admin_health_summary()
   where check_name = 'home_load';
  if v_status is distinct from 'fail' then
    raise exception 'ASSERT FAILED: summary should surface latest home_load=fail, got %', v_status;
  end if;
end $$;

rollback;
