-- supabase/tests/0199_posts_status_transition_guard.sql
-- Regression for migration 0199 (TD-172 / audit M2).
--
-- A post owner used to be able to bypass the closure state-machine with a raw
-- PostgREST UPDATE (mint closure karma via status='closed_delivered', fake
-- removed_admin/expired, reset reopen_count). 0199 adds a BEFORE UPDATE guard
-- that rejects illegal CLIENT-direct transitions while letting the legitimate
-- closure/reopen RPCs (flagged) and all SECURITY DEFINER paths through.
--
-- Runs as the `authenticated` role (the harness is otherwise postgres, which
-- bypasses RLS *and* this guard via current_user). Wrapped in a rolled-back
-- transaction; ON_ERROR_STOP=1 means any raise fails the CI step.

begin;

-- Fixed ids (owner …a1, recipient …b2, post …c3) embedded directly in the
-- dynamic SQL strings below.

-- Create a confirmed auth user + matching public.users row (mirrors 0193).
create or replace function pg_temp.mk_user(p_id uuid, p_handle text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
  values (p_id, p_handle || '@test.local', now(),
          jsonb_build_object('full_name', 'Display ' || p_handle),
          jsonb_build_object('provider', 'email'),
          'authenticated', 'authenticated');
  update public.users
     set share_handle = p_handle, display_name = 'Display ' || p_handle,
         privacy_mode = 'Public', account_status = 'active'
   where user_id = p_id;
end $$;

-- Assert a statement is rejected by the guard with the expected message.
create or replace function pg_temp.expect_blocked(p_sql text, p_expect text)
returns void language plpgsql as $$
declare v_blocked boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    v_blocked := true;
    if sqlerrm not like '%' || p_expect || '%' then
      raise exception 'ASSERT FAILED: expected "%", got: %', p_expect, sqlerrm;
    end if;
  end;
  if not v_blocked then
    raise exception 'ASSERT FAILED: statement should have been blocked: %', p_sql;
  end if;
end $$;

-- Seed owner + recipient + an open post (as postgres; bypasses RLS).
do $$
declare v_city text;
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000199a1', 'td172_owner');
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000199b2', 'td172_recip');
  select city_id into v_city from public.cities limit 1;
  if v_city is null then
    raise exception 'PRECONDITION FAILED: no cities seeded';
  end if;
  insert into public.posts (post_id, owner_id, type, status, visibility,
                            title, description, category, city, street, street_number)
  values ('00000000-0000-0000-0000-0000000199c3',
          '00000000-0000-0000-0000-0000000199a1',
          'Give', 'open', 'Public', 'TD-172 guard test', 'desc', 'Other',
          v_city, 'Herzl', '1');
end $$;

-- Impersonate the post owner as a plain authenticated client.
select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', '00000000-0000-0000-0000-0000000199a1', 'role', 'authenticated')::text,
  true
);
set local role authenticated;

-- ── BLOCKED: raw client status writes that bypass the closure state-machine ──
select pg_temp.expect_blocked(
  $q$update public.posts set status='closed_delivered' where post_id='00000000-0000-0000-0000-0000000199c3'$q$,
  'posts_illegal_status_transition');   -- karma mint
select pg_temp.expect_blocked(
  $q$update public.posts set status='removed_admin' where post_id='00000000-0000-0000-0000-0000000199c3'$q$,
  'posts_illegal_status_transition');   -- fake moderation removal
select pg_temp.expect_blocked(
  $q$update public.posts set status='expired' where post_id='00000000-0000-0000-0000-0000000199c3'$q$,
  'posts_illegal_status_transition');   -- fake expiry
select pg_temp.expect_blocked(
  $q$update public.posts set reopen_count = reopen_count + 5 where post_id='00000000-0000-0000-0000-0000000199c3'$q$,
  'posts_reopen_count_is_server_managed');  -- reopen-ceiling reset

-- ── ALLOWED: content edit leaves status untouched ──
update public.posts set title = 'TD-172 edited' where post_id = '00000000-0000-0000-0000-0000000199c3';

-- ── ALLOWED: legitimate closure via RPC (open -> closed_delivered, flagged) ──
select public.close_post_with_recipient(
  '00000000-0000-0000-0000-0000000199c3', '00000000-0000-0000-0000-0000000199b2');

-- ── ALLOWED: legitimate reopen via RPC (closed_delivered -> open, flagged) ──
select public.reopen_post_marked('00000000-0000-0000-0000-0000000199c3');

-- ── ALLOWED: legitimate client-direct close-without-recipient ──
update public.posts
   set status = 'deleted_no_recipient', delete_after = now() + interval '7 days'
 where post_id = '00000000-0000-0000-0000-0000000199c3';

-- ── ALLOWED: reopen via the (drift-healed) RPC (deleted_no_recipient -> open) ──
select public.reopen_post_deleted_no_recipient('00000000-0000-0000-0000-0000000199c3');

-- Final state sanity + summary.
do $$
declare v_status text;
begin
  select status into v_status from public.posts where post_id = '00000000-0000-0000-0000-0000000199c3';
  if v_status <> 'open' then
    raise exception 'ASSERT FAILED: expected final status open, got %', v_status;
  end if;
  raise notice '✓ 0199: illegal client status/reopen_count writes blocked; closure/reopen RPCs + open->deleted_no_recipient allowed';
end $$;

reset role;
rollback;

\echo '✓ 0199 posts status-transition guard regression test passed'
