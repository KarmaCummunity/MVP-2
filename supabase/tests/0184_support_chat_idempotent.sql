-- TD-83 — find_or_create_support_chat is an atomic upsert (no read-then-insert
-- race). Two calls for the same user must return the SAME support chat, and
-- exactly one support-thread row must exist for the pair.

create or replace function pg_temp.mk_user(p_handle text)
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, email, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    aud, role
  ) values (
    v_id,
    p_handle || '@test.local',
    now(),
    jsonb_build_object('full_name', 'Display ' || p_handle),
    jsonb_build_object('provider', 'email'),
    'authenticated',
    'authenticated'
  );
  update public.users
     set share_handle   = p_handle,
         display_name   = 'Display ' || p_handle,
         account_status = 'active'
   where user_id = v_id;
  return v_id;
end $$;

do $$
declare
  v_admin uuid := pg_temp.mk_user('sup_admin_' || substr(gen_random_uuid()::text, 1, 8));
  v_user  uuid := pg_temp.mk_user('sup_user_'  || substr(gen_random_uuid()::text, 1, 8));
  v_c1    uuid;
  v_c2    uuid;
  v_cnt   int;
begin
  update public.users set is_super_admin = true where user_id = v_admin;

  v_c1 := public.find_or_create_support_chat(v_user);
  v_c2 := public.find_or_create_support_chat(v_user);

  if v_c1 is null then
    raise exception 'ASSERT FAILED: support chat was null (no super_admin resolved)';
  end if;
  if v_c1 <> v_c2 then
    raise exception 'ASSERT FAILED: find_or_create_support_chat not idempotent: % vs %', v_c1, v_c2;
  end if;

  select count(*) into v_cnt
  from public.chats
  where is_support_thread = true
    and (participant_a = v_user or participant_b = v_user);
  if v_cnt <> 1 then
    raise exception 'ASSERT FAILED: expected exactly 1 support chat for the user, got %', v_cnt;
  end if;

  raise notice '✓ find_or_create_support_chat is an idempotent atomic upsert (TD-83)';
end $$;
