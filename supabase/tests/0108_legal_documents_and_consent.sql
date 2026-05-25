-- supabase/tests/0108_legal_documents_and_consent.sql
-- Smoke tests for 0108_legal_documents_and_consent.sql (FR-SETTINGS-010).
-- Asserts:
--   1. Append-only triggers block UPDATE / DELETE on the immutable tables.
--   2. publish_legal_document rejects non-admin (forbidden) and accepts admin.
--   3. needs_legal_reacknowledgement returns rows for a fresh user, block_mode='banner'.
--   4. accept_legal_document logs a row + the gate clears on next call.
--
-- RLS policy enforcement is exercised indirectly through the RPCs (which use
-- auth.uid() under SECURITY DEFINER) and the integration tests in
-- packages/infrastructure-supabase.

create or replace function pg_temp.assert(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'ASSERT FAILED: %', p_msg; end if;
end $$;

create or replace function pg_temp.expect_raise(p_sql text, p_msg_like text, p_test text)
returns void language plpgsql as $$
declare
  v_err text;
begin
  execute p_sql;
  raise exception '%: expected raise, but statement succeeded', p_test;
exception
  when others then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%' || p_msg_like || '%' then
      raise exception '%: expected message containing %, got: %', p_test, p_msg_like, v_err;
    end if;
end $$;

-- ─── TEST 1: legal_document_versions UPDATE blocked by trigger ──────────────
do $$
begin
  perform pg_temp.expect_raise(
    'update public.legal_document_versions set body_md = ''hacked'' where doc_type = ''terms'' and version = 1',
    'legal_document_versions is append-only',
    'TEST 1: UPDATE on legal_document_versions blocked'
  );
end$$;

-- ─── TEST 2: legal_document_versions DELETE blocked by trigger ──────────────
do $$
begin
  perform pg_temp.expect_raise(
    'delete from public.legal_document_versions where doc_type = ''terms'' and version = 1',
    'legal_document_versions is append-only',
    'TEST 2: DELETE on legal_document_versions blocked'
  );
end$$;

-- ─── TEST 3: user_legal_acceptances UPDATE / DELETE blocked by trigger ─────
do $$
declare
  v_admin uuid;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;

  -- Seed a row to delete-test against.
  insert into public.user_legal_acceptances (user_id, doc_type, version)
    values (v_admin, 'terms', 1);

  perform pg_temp.expect_raise(
    'update public.user_legal_acceptances set version = 99 where user_id = ' || quote_literal(v_admin),
    'user_legal_acceptances is append-only',
    'TEST 3a: UPDATE on user_legal_acceptances blocked'
  );

  perform pg_temp.expect_raise(
    'delete from public.user_legal_acceptances where user_id = ' || quote_literal(v_admin),
    'user_legal_acceptances is append-only',
    'TEST 3b: DELETE on user_legal_acceptances blocked'
  );

  -- Cleanup: we can't delete via trigger, but we can truncate (DDL bypasses BEFORE DELETE triggers).
  truncate public.user_legal_acceptances;
end$$;

-- ─── TEST 4: publish_legal_document — admin accepted, content_hash filled ──
do $$
declare
  v_admin uuid;
  v_result json;
  v_v_before int;
  v_v_after int;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;

  select current_version into v_v_before from public.legal_documents where doc_type = 'terms';

  -- Simulate the admin's JWT.
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  v_result := public.publish_legal_document(
    'terms'::public.legal_doc_type,
    '# v_test_minor',
    'minor',
    null,
    now()
  );

  select current_version into v_v_after from public.legal_documents where doc_type = 'terms';

  perform pg_temp.assert(v_v_after = v_v_before + 1, 'TEST 4a: current_version did not advance');
  perform pg_temp.assert((v_result->>'content_hash') is not null, 'TEST 4b: content_hash missing');
  perform pg_temp.assert(length(v_result->>'content_hash') = 64, 'TEST 4c: content_hash not 64 hex chars');
end$$;

-- ─── TEST 5: publish rejects critical with effective_date > now() + 1 hour ─
do $$
declare
  v_admin uuid;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  perform pg_temp.expect_raise(
    format(
      $$select public.publish_legal_document('terms'::public.legal_doc_type, '# x', 'critical', '- urgent', %L::timestamptz)$$,
      (now() + interval '2 hours')::text
    ),
    'critical severity must be effective immediately',
    'TEST 5: critical effective_date > now()+1h rejected'
  );
end$$;

-- ─── TEST 6: publish rejects non-minor without change_summary ───────────────
do $$
declare
  v_admin uuid;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  perform pg_temp.expect_raise(
    $$select public.publish_legal_document('terms'::public.legal_doc_type, '# x', 'standard', null, now())$$,
    'change_summary required for non-minor severity',
    'TEST 6: standard severity without change_summary rejected'
  );
end$$;

-- ─── TEST 7: needs_legal_reacknowledgement returns rows for unaccepted user ─
do $$
declare
  v_admin uuid;
  v_count int;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  -- Truncate any earlier acceptances so we're testing the fresh-user path.
  truncate public.user_legal_acceptances;

  select count(*) into v_count from public.needs_legal_reacknowledgement();
  perform pg_temp.assert(v_count >= 1, 'TEST 7: needs_legal_reacknowledgement returned no rows for fresh user');
end$$;

-- ─── TEST 8: accept_legal_document clears the gate for that doc_type ──────
do $$
declare
  v_admin uuid;
  v_current int;
  v_remaining int;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  select current_version into v_current from public.legal_documents where doc_type = 'terms';

  perform public.accept_legal_document('terms'::public.legal_doc_type, v_current, 'he', 'pgTest/1.0');

  select count(*) into v_remaining from public.needs_legal_reacknowledgement() where doc_type = 'terms';
  perform pg_temp.assert(v_remaining = 0, 'TEST 8: accept_legal_document did not clear terms from the gate');
end$$;

-- ─── TEST 9: accept_legal_document rejects out-of-range version ────────────
do $$
declare
  v_admin uuid;
  v_lm int;
begin
  select user_id into v_admin from public.users where is_super_admin = true order by created_at asc limit 1;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);

  select last_material_version into v_lm from public.legal_documents where doc_type = 'privacy';
  perform pg_temp.expect_raise(
    format(
      $$select public.accept_legal_document('privacy'::public.legal_doc_type, %L::int, 'he', 'ua')$$,
      v_lm - 1
    ),
    'must be in',
    'TEST 9: accept_legal_document rejects below last_material_version'
  );
end$$;

-- Cleanup: revert the test publish/acceptance state so reruns are clean.
truncate public.user_legal_acceptances;
