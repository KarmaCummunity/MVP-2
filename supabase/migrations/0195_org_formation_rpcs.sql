-- 0195_org_formation_rpcs — FR-ADMIN-021 RPCs for the Org Formation Journey.
--
-- All gated by admin_assert_role(super_admin). Widening to more roles later is a
-- one-line change to the role array (the UI gates on org_formation.* perms).
--
-- Mapped to spec: docs/SSOT/spec/12_super_admin.md §15, FR-ADMIN-021.

BEGIN;

-- ── get-or-create the journey for a country ─────────────────────────────────
create or replace function public.org_formation_get_journey(p_country text default 'IL')
returns table (
  journey_id   uuid,
  org_id       uuid,
  country_code text,
  status       text,
  created_at   timestamptz,
  updated_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_country text := upper(btrim(coalesce(p_country, 'IL')));
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country' using errcode = '22023';
  end if;

  insert into public.org_formation_journeys (country_code, created_by)
  values (v_country, v_actor)
  on conflict (country_code) do nothing;

  return query
  select j.journey_id, j.org_id, j.country_code, j.status, j.created_at, j.updated_at
  from public.org_formation_journeys j
  where j.country_code = v_country;
end;
$$;
revoke execute on function public.org_formation_get_journey(text) from public;
grant  execute on function public.org_formation_get_journey(text) to authenticated;

-- ── list steps merged with journey progress ─────────────────────────────────
create or replace function public.org_formation_list_steps(p_journey_id uuid)
returns table (
  step_id          uuid,
  step_key         text,
  sort_order       int,
  title_fallback   text,
  body_text        text,
  tips             jsonb,
  is_critical_gate boolean,
  progress_status  text,
  progress_note    text
)
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_country text;
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  select country_code into v_country
  from public.org_formation_journeys where journey_id = p_journey_id;
  if v_country is null then
    raise exception 'journey_not_found' using errcode = 'P0002';
  end if;

  return query
  select
    s.step_id, s.step_key, s.sort_order, s.title_fallback, s.body_text,
    s.tips, s.is_critical_gate,
    coalesce(p.status, 'not_started') as progress_status,
    p.note as progress_note
  from public.org_formation_steps s
  left join public.org_formation_step_progress p
    on p.journey_id = p_journey_id and p.step_key = s.step_key
  where s.country_code = v_country and s.is_active
  order by s.sort_order;
end;
$$;
revoke execute on function public.org_formation_list_steps(uuid) from public;
grant  execute on function public.org_formation_list_steps(uuid) to authenticated;

-- ── list governance members ─────────────────────────────────────────────────
create or replace function public.org_formation_list_governance(p_journey_id uuid)
returns table (
  assignment_id   uuid,
  user_id         uuid,
  display_name    text,
  avatar_url      text,
  governance_role text,
  created_at      timestamptz
)
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  return query
  select g.assignment_id, g.user_id, u.display_name, u.avatar_url,
         g.governance_role, g.created_at
  from public.org_formation_governance g
  join public.users u on u.user_id = g.user_id
  where g.journey_id = p_journey_id
  order by g.governance_role, g.created_at;
end;
$$;
revoke execute on function public.org_formation_list_governance(uuid) from public;
grant  execute on function public.org_formation_list_governance(uuid) to authenticated;

-- ── set step progress (with critical-gate governance validation) ────────────
create or replace function public.org_formation_set_step_progress(
  p_journey_id uuid,
  p_step_key   text,
  p_status     text,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_country text;
  v_gate    boolean;
  v_board   int;
  v_audit   int;
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  if p_status not in ('not_started','in_progress','done') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select country_code into v_country
  from public.org_formation_journeys where journey_id = p_journey_id;
  if v_country is null then
    raise exception 'journey_not_found' using errcode = 'P0002';
  end if;

  select is_critical_gate into v_gate
  from public.org_formation_steps
  where country_code = v_country and step_key = p_step_key and is_active;
  if v_gate is null then
    raise exception 'step_not_found' using errcode = 'P0002';
  end if;

  -- Critical gate: cannot mark "done" unless governance satisfies the legal
  -- minimum (≥2 board, ≥1 audit). Overlap is prevented at assignment time.
  if v_gate and p_status = 'done' then
    select
      count(*) filter (where governance_role = 'board_member'),
      count(*) filter (where governance_role = 'audit_member')
      into v_board, v_audit
    from public.org_formation_governance
    where journey_id = p_journey_id;
    if v_board < 2 or v_audit < 1 then
      raise exception 'governance_incomplete'
        using errcode = '23514',
              detail = format('board=%s audit=%s', v_board, v_audit);
    end if;
  end if;

  insert into public.org_formation_step_progress (journey_id, step_key, status, note, updated_by)
  values (p_journey_id, p_step_key, p_status, nullif(btrim(coalesce(p_note, '')), ''), v_actor)
  on conflict (journey_id, step_key) do update
    set status = excluded.status,
        note = excluded.note,
        updated_at = now(),
        updated_by = v_actor;

  insert into public.audit_events (actor_id, action, target_type, metadata)
  values (v_actor, 'org_formation_step_progress', 'none',
    jsonb_build_object('journey_id', p_journey_id, 'step_key', p_step_key, 'status', p_status));
end;
$$;
revoke execute on function public.org_formation_set_step_progress(uuid, text, text, text) from public;
grant  execute on function public.org_formation_set_step_progress(uuid, text, text, text) to authenticated;

-- ── edit step content (body + tips) ─────────────────────────────────────────
create or replace function public.org_formation_update_step_content(
  p_step_id   uuid,
  p_body_text text,
  p_tips      jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id    uuid;
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  if p_tips is not null and jsonb_typeof(p_tips) <> 'array' then
    raise exception 'invalid_tips' using errcode = '22023';
  end if;

  update public.org_formation_steps
     set body_text  = coalesce(left(p_body_text, 4000), body_text),
         tips       = coalesce(p_tips, tips),
         updated_at = now(),
         updated_by = v_actor
   where step_id = p_step_id
   returning step_id into v_id;
  if v_id is null then
    raise exception 'step_not_found' using errcode = 'P0002';
  end if;

  insert into public.audit_events (actor_id, action, target_type, metadata)
  values (v_actor, 'org_formation_content_edit', 'none',
    jsonb_build_object('step_id', p_step_id));
end;
$$;
revoke execute on function public.org_formation_update_step_content(uuid, text, jsonb) from public;
grant  execute on function public.org_formation_update_step_content(uuid, text, jsonb) to authenticated;

-- ── assign a governance member (grants org-scoped RBAC role) ────────────────
create or replace function public.org_formation_assign_member(
  p_journey_id      uuid,
  p_user_id         uuid,
  p_governance_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid := auth.uid();
  v_org      uuid;
  v_status   text;
  v_rbac     text;
  v_grant_id uuid;
  v_other    text;
  v_id       uuid;
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  if p_governance_role not in ('board_member','audit_member') then
    raise exception 'invalid_governance_role' using errcode = '22023';
  end if;

  select org_id into v_org
  from public.org_formation_journeys where journey_id = p_journey_id;
  if v_org is null then
    raise exception 'journey_not_found' using errcode = 'P0002';
  end if;

  select account_status into v_status from public.users where user_id = p_user_id;
  if v_status is null then
    raise exception 'target_not_found' using errcode = 'P0002';
  end if;
  if v_status <> 'active' then
    raise exception 'target_not_active' using errcode = '23514';
  end if;

  -- §30: a person cannot serve on both the board and the audit committee.
  v_other := case when p_governance_role = 'board_member'
                  then 'audit_member' else 'board_member' end;
  if exists (
    select 1 from public.org_formation_governance
    where journey_id = p_journey_id and user_id = p_user_id and governance_role = v_other
  ) then
    raise exception 'governance_overlap' using errcode = '23514';
  end if;

  v_rbac := case when p_governance_role = 'board_member'
                 then 'org_board_member' else 'org_audit_member' end;

  -- Grant (or reuse) the org-scoped RBAC role.
  begin
    insert into public.admin_role_grants (user_id, role, scope_org_id, granted_by)
    values (p_user_id, v_rbac, v_org, v_actor)
    returning grant_id into v_grant_id;
  exception when unique_violation then
    select grant_id into v_grant_id
    from public.admin_role_grants
    where user_id = p_user_id and role = v_rbac
      and scope_org_id = v_org and revoked_at is null;
  end;

  insert into public.org_formation_governance
    (journey_id, user_id, governance_role, role_grant_id, created_by)
  values (p_journey_id, p_user_id, p_governance_role, v_grant_id, v_actor)
  returning assignment_id into v_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'org_formation_member_assign', 'user', p_user_id,
    jsonb_build_object('journey_id', p_journey_id, 'governance_role', p_governance_role, 'grant_id', v_grant_id));

  return v_id;
exception when unique_violation then
  raise exception 'member_already_assigned' using errcode = '23505';
end;
$$;
revoke execute on function public.org_formation_assign_member(uuid, uuid, text) from public;
grant  execute on function public.org_formation_assign_member(uuid, uuid, text) to authenticated;

-- ── remove a governance member (revokes the linked RBAC grant) ──────────────
create or replace function public.org_formation_remove_member(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_user    uuid;
  v_grant   uuid;
  v_role    text;
begin
  perform admin_assert_role(v_actor, array['super_admin']);

  select user_id, role_grant_id, governance_role
    into v_user, v_grant, v_role
  from public.org_formation_governance
  where assignment_id = p_assignment_id;
  if v_user is null then
    raise exception 'assignment_not_found' using errcode = 'P0002';
  end if;

  delete from public.org_formation_governance where assignment_id = p_assignment_id;

  if v_grant is not null then
    update public.admin_role_grants
       set revoked_at = now(), revoked_by = v_actor
     where grant_id = v_grant and revoked_at is null;
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'org_formation_member_remove', 'user', v_user,
    jsonb_build_object('assignment_id', p_assignment_id, 'governance_role', v_role));
end;
$$;
revoke execute on function public.org_formation_remove_member(uuid) from public;
grant  execute on function public.org_formation_remove_member(uuid) to authenticated;

COMMIT;
