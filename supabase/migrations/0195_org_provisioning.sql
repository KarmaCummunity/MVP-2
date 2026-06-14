-- 0195_org_provisioning — Nonprofit OS Track B1 — transactional org creation on approval.
-- Mapped to spec: docs/SSOT/spec/18_organizations.md FR-ORG-010.
-- Decisions: D-60 (tenancy), D-62 (dual-track).
--
-- Until now `admin_org_application_decide` (0168) was a status flip + audit only —
-- approval had no side-effect because there was no organizations table. B0 (0194)
-- added the tenant root; this slice makes approval actually PROVISION a tenant:
--   organization + settings + branding + founder membership + founder org_admin grant.
-- Reject path is unchanged.

-- ── 1. record the provisioned org on the application ─────────────────────────
alter table public.org_applications
  add column if not exists created_org_id uuid references public.organizations(id) on delete set null;

comment on column public.org_applications.created_org_id is
  'FR-ORG-010 — the organization provisioned when this application was approved (NULL for pending/rejected/legacy).';

-- ── 2. slug generator — safe + unique ───────────────────────────────────────
-- Derives an org slug from a (possibly Hebrew) display name. Non [a-z0-9] runs
-- collapse to '-'; empties fall back to 'org'; uniqueness guaranteed by suffixing.
create or replace function public.generate_org_slug(p_name text)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_base text;
  v_slug text;
begin
  v_base := lower(coalesce(p_name, ''));
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := btrim(v_base, '-');
  v_base := left(v_base, 40);
  v_base := btrim(v_base, '-');
  if v_base = '' then
    v_base := 'org';
  end if;

  v_slug := v_base;
  -- Append a short random suffix until the slug is free.
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_slug := left(v_base, 40) || '-' || substr(md5(random()::text), 1, 6);
  end loop;

  return v_slug;
end;
$$;

-- ── 3. admin_org_application_decide v2 — provision on approve ────────────────
create or replace function public.admin_org_application_decide(
  p_application_id uuid,
  p_approve        boolean,
  p_note           text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor       uuid := auth.uid();
  v_curr        record;
  v_target      text;
  v_org_id      uuid;
  v_has_default boolean;
begin
  perform admin_assert_role(v_actor, array['super_admin','moderator']);

  select * into v_curr from public.org_applications
  where application_id = p_application_id for update;
  if v_curr.application_id is null then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;
  if v_curr.status <> 'pending' then
    raise exception 'application_already_decided' using errcode = '22023';
  end if;

  v_target := case when p_approve then 'approved' else 'rejected' end;

  if p_approve then
    -- Provision the tenant.
    insert into public.organizations (slug, display_name, legal_name, status)
    values (
      public.generate_org_slug(v_curr.org_name),
      v_curr.org_name,
      v_curr.org_name,
      'active'
    )
    returning id into v_org_id;

    insert into public.org_settings (org_id) values (v_org_id);
    insert into public.org_branding (org_id) values (v_org_id);

    -- Founder membership; default only if the applicant has no default org yet.
    select exists (
      select 1 from public.org_memberships
      where user_id = v_curr.applicant_user_id and is_default
    ) into v_has_default;

    insert into public.org_memberships (org_id, user_id, is_default)
    values (v_org_id, v_curr.applicant_user_id, not v_has_default)
    on conflict (user_id, org_id) do nothing;

    -- Founder gets org_admin scoped to the new org. Authorized by the approval
    -- itself (SECURITY DEFINER) — bypasses can_grant_role on purpose.
    insert into public.admin_role_grants (user_id, role, scope_org_id, granted_by)
    values (v_curr.applicant_user_id, 'org_admin', v_org_id, v_actor)
    on conflict do nothing;
  end if;

  update public.org_applications
     set status         = v_target,
         reviewed_at    = now(),
         reviewed_by    = v_actor,
         review_note    = nullif(btrim(coalesce(p_note, '')), ''),
         created_org_id = v_org_id
   where application_id = p_application_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor,
    case when p_approve then 'org_application_approve' else 'org_application_reject' end,
    'org_application',
    p_application_id,
    jsonb_strip_nulls(jsonb_build_object(
      'org_name',          v_curr.org_name,
      'applicant_user_id', v_curr.applicant_user_id,
      'created_org_id',    v_org_id,
      'note',              p_note
    ))
  );
end;
$$;

revoke execute on function public.admin_org_application_decide(uuid, boolean, text) from public;
grant  execute on function public.admin_org_application_decide(uuid, boolean, text) to authenticated;
