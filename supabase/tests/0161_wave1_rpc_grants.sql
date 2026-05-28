-- Wave 1 / TD-161 — anon must not EXECUTE research submit or has_admin_role.

create or replace function pg_temp.assert(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'ASSERT FAILED: %', p_msg; end if;
end $$;

-- ─── anon cannot call submit_public_research_response ───────────────────────
do $$
begin
  begin
    set local role anon;
    perform public.submit_public_research_response(
      'missing-slug', 1, 'direct', 'hash', 'ua', '{}'::jsonb, '', null, null
    );
    raise exception 'ASSERT FAILED: anon submit_public_research_response should be denied';
  exception
    when insufficient_privilege then
      raise notice '✓ anon submit_public_research_response denied';
  end;
  reset role;
end $$;

-- ─── anon cannot call has_admin_role ────────────────────────────────────────
do $$
declare
  v_uid uuid := gen_random_uuid();
begin
  begin
    set local role anon;
    perform public.has_admin_role(v_uid, 'super_admin');
    raise exception 'ASSERT FAILED: anon has_admin_role should be denied';
  exception
    when insufficient_privilege then
      raise notice '✓ anon has_admin_role denied';
  end;
  reset role;
end $$;
