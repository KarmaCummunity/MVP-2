-- supabase/tests/0215_glowe_wishing_well.sql
-- Regression for migration 0215 (FR-GLOWE-006 Wishing Well foundation).
--
-- Verifies:
--   • a wish post (post_type='wish') is publicly readable, like other glowe_posts
--   • the post_type / status CHECK constraints reject invalid values
--   • glowe_offers is owner-only: a member reads their own offers but not others';
--     an anonymous caller cannot read offers at all
--
-- Wrapped in a rolled-back transaction; ON_ERROR_STOP=1 means any raise fails CI.

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
     set share_handle = p_handle, display_name = 'Display ' || p_handle, account_status = 'active'
   where user_id = p_id;
end $$;

create or replace function pg_temp.expect_blocked(p_sql text, variadic p_expects text[])
returns void language plpgsql as $$
declare v_blocked boolean := false;
begin
  begin execute p_sql;
  exception when others then
    v_blocked := true;
    if not exists (select 1 from unnest(p_expects) e where sqlerrm like '%' || e || '%') then
      raise exception 'ASSERT FAILED: expected one of %, got: %', p_expects, sqlerrm;
    end if;
  end;
  if not v_blocked then raise exception 'ASSERT FAILED: should have been blocked: %', p_sql; end if;
end $$;

create or replace function pg_temp.act_as(p_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', jsonb_build_object('sub', p_id::text, 'role', 'authenticated')::text, true); end $$;

do $$
begin
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000215a1', 'glowe_wish15a');
  perform pg_temp.mk_user('00000000-0000-0000-0000-0000000215b1', 'glowe_wish15b');
end $$;

-- User A posts a wish.
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000215a1');
set local role authenticated;
insert into public.glowe_posts (id, user_id, title, post_type, wish_type, impact_area, status)
values ('post-wish0215', '00000000-0000-0000-0000-0000000215a1', 'Need volunteers', 'wish', 'Volunteers Needed', 'Education', 'open');

-- Defaults: a plain post is a community post that is open.
insert into public.glowe_posts (id, user_id, title)
values ('post-plain0215', '00000000-0000-0000-0000-0000000215a1', 'Hello');
do $$
declare v_type text; v_status text;
begin
  select post_type, status into v_type, v_status from public.glowe_posts where id = 'post-plain0215';
  if v_type <> 'community' or v_status <> 'open' then
    raise exception 'ASSERT FAILED: defaults should be community/open, got %/%', v_type, v_status;
  end if;
end $$;

-- BLOCKED: invalid post_type / status violate the CHECK constraints.
select pg_temp.expect_blocked(
  $q$insert into public.glowe_posts (id, user_id, title, post_type) values ('post-bad0215', '00000000-0000-0000-0000-0000000215a1', 'X', 'bogus')$q$,
  'glowe_posts_post_type_chk');
select pg_temp.expect_blocked(
  $q$insert into public.glowe_posts (id, user_id, title, status) values ('post-bad0215b', '00000000-0000-0000-0000-0000000215a1', 'X', 'archived')$q$,
  'glowe_posts_status_chk');

-- ALLOWED: anonymous visitor reads the open wish (public read).
reset role;
select set_config('request.jwt.claims', jsonb_build_object('role', 'anon')::text, true);
set local role anon;
do $$
declare v_count int;
begin
  select count(*) into v_count from public.glowe_posts where id = 'post-wish0215' and post_type = 'wish' and status = 'open';
  if v_count <> 1 then raise exception 'ASSERT FAILED: anon should read the open wish, got %', v_count; end if;
end $$;

-- User B offers support on A's wish.
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000215b1');
set local role authenticated;
insert into public.glowe_offers (post_id, user_id, offer_text, availability, contact_preference)
values ('post-wish0215', '00000000-0000-0000-0000-0000000215b1', 'I can help weekends', 'Weekends', 'email');
do $$
declare v_count int;
begin
  select count(*) into v_count from public.glowe_offers where post_id = 'post-wish0215';
  if v_count <> 1 then raise exception 'ASSERT FAILED: B should read their own offer, got %', v_count; end if;
end $$;

-- BLOCKED (silently): the wish owner A cannot read B's offer via the base table (owner-only RLS).
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000215a1');
set local role authenticated;
do $$
declare v_count int;
begin
  select count(*) into v_count from public.glowe_offers where post_id = 'post-wish0215';
  if v_count <> 0 then raise exception 'ASSERT FAILED: owner must not see offers via base table (RLS), got %', v_count; end if;
end $$;

-- Anonymous sees no offer data — whether denied outright (clean-stack grants) or
-- filtered to zero rows by RLS (dev's broad table grants). Both are acceptable.
reset role;
select set_config('request.jwt.claims', jsonb_build_object('role', 'anon')::text, true);
set local role anon;
do $$
declare v_count int;
begin
  begin
    select count(*) into v_count from public.glowe_offers;
  exception when insufficient_privilege then
    v_count := 0;
  end;
  if v_count <> 0 then raise exception 'ASSERT FAILED: anon must not read offers, got %', v_count; end if;
end $$;

do $$
begin
  raise notice '0215 OK: wish columns + constraints + glowe_offers owner-only RLS verified';
end $$;

reset role;
rollback;

\echo '✓ 0215 glowe wishing well regression test passed'
