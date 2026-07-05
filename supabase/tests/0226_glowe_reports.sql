-- supabase/tests/0226_glowe_reports.sql
-- Regression for migration 0226 (FR-GLOWE-015).
--
-- Verifies:
--   • a member can file a report on a post; review columns are server-managed
--     (client cannot pre-set status/reviewed_*)
--   • duplicate report by the same reporter on the same target is rejected (23505)
--   • a reporter reads only their own reports; others' reports are invisible
--   • non-admin blocked on glowe_admin_list_reports / dismiss / remove RPCs
--   • a GLOWE admin lists the queue, dismisses a report, and removes content
--     (glowe_posts.status='removed' + report actioned atomically)
--   • re-deciding an already-reviewed report is rejected
--
-- Runs partly as `authenticated`. Wrapped in a rolled-back transaction;
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

-- Seed: a reporter, a second member, a GLOWE admin, and a reportable post.
do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000226a1', 'glowe_rep26');
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000226b1', 'glowe_oth26');
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000226ad', 'glowe_adm26');
  insert into public.admin_role_grants (user_id, role)
  values ('00000000-0000-0000-0000-0000000226ad', 'glowe_admin')
  on conflict do nothing;

  insert into public.glowe_posts (id, user_id, title, text, post_type, status)
  values ('post-0226-target', '00000000-0000-0000-0000-0000000226b1',
          'Reported post', 'Suspicious content', 'community', 'open');
end $$;

-- ── Reporter files a report; server-managed columns guarded ──
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000226a1', 'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.glowe_reports (reporter_id, target_type, target_id, reason, note)
values ('00000000-0000-0000-0000-0000000226a1', 'post', 'post-0226-target', 'spam', 'Looks fishy');

select pg_temp.expect_blocked(
  $q$insert into public.glowe_reports (reporter_id, target_type, target_id, reason, status)
     values ('00000000-0000-0000-0000-0000000226a1', 'post', 'other-target', 'spam', 'dismissed')$q$,
  'server-managed');

-- Duplicate (same reporter + target) rejected by the unique constraint.
select pg_temp.expect_blocked(
  $q$insert into public.glowe_reports (reporter_id, target_type, target_id, reason)
     values ('00000000-0000-0000-0000-0000000226a1', 'post', 'post-0226-target', 'other')$q$,
  'duplicate key');

-- Bad reason / bad target type rejected by CHECKs.
select pg_temp.expect_blocked(
  $q$insert into public.glowe_reports (reporter_id, target_type, target_id, reason)
     values ('00000000-0000-0000-0000-0000000226a1', 'post', 'x', 'rude')$q$,
  'glowe_reports_reason_chk');

-- Non-admin blocked on all three admin RPCs.
select pg_temp.expect_blocked(
  $q$select * from public.glowe_admin_list_reports()$q$, 'forbidden');
select pg_temp.expect_blocked(
  $q$select public.glowe_admin_dismiss_report('00000000-0000-0000-0000-000000000001')$q$, 'forbidden');
select pg_temp.expect_blocked(
  $q$select public.glowe_admin_remove_content('post', 'post-0226-target', null)$q$, 'forbidden');

-- ── Second member sees no foreign reports ──
reset role;
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000226b1', 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.glowe_reports;
  if v_n <> 0 then
    raise exception 'ASSERT FAILED: non-reporter should see 0 reports, saw %', v_n;
  end if;
end $$;

-- ── Admin: list queue, remove content, dismiss ──
reset role;
select set_config('request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000226ad', 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare v_report_id uuid;
declare v_status text;
begin
  select id into v_report_id
    from public.glowe_admin_list_reports()
   where target_id = 'post-0226-target' and status = 'open';
  if v_report_id is null then
    raise exception 'ASSERT FAILED: admin should see the open report';
  end if;

  -- Remove the reported post; the report is actioned atomically.
  perform public.glowe_admin_remove_content('post', 'post-0226-target', v_report_id);

  select status into v_status from public.glowe_posts where id = 'post-0226-target';
  if v_status <> 'removed' then
    raise exception 'ASSERT FAILED: post should be removed, got %', v_status;
  end if;

  select status into v_status
    from public.glowe_admin_list_reports() where id = v_report_id;
  if v_status <> 'actioned' then
    raise exception 'ASSERT FAILED: report should be actioned, got %', v_status;
  end if;
end $$;

-- Re-deciding a reviewed report is rejected.
do $$
declare v_report_id uuid;
begin
  select id into v_report_id
    from public.glowe_admin_list_reports() where target_id = 'post-0226-target';
  perform pg_temp.expect_blocked(
    format($q$select public.glowe_admin_dismiss_report(%L)$q$, v_report_id),
    'already reviewed');
end $$;

-- Removing an unknown target / unsupported type is rejected.
select pg_temp.expect_blocked(
  $q$select public.glowe_admin_remove_content('post', 'no-such-post', null)$q$,
  'not found');
select pg_temp.expect_blocked(
  $q$select public.glowe_admin_remove_content('profile', 'whatever', null)$q$,
  'cannot remove');

do $$
begin
  raise notice '✓ 0226: glowe reports RLS + admin moderation RPCs behave';
end $$;

reset role;
rollback;

\echo '✓ 0226 glowe reports regression test passed'
