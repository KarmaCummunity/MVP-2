-- 0206_glowe_org_approval — GloWe organization approval workflow (FR-GLOWE-003).
--
-- FR-GLOWE-002 (migration 0205) lets an organization submit its details and
-- lands it at approval_status='pending', held view-only. This migration adds
-- the privileged side: two SECURITY DEFINER RPCs, gated to KC super-admins, so
-- the GloWe Admin page can review the pending queue and approve/reject orgs.
--
-- The client-write guard from 0205 (glowe_profiles_guard_approval) blocks
-- authenticated/anon from setting 'approved'/'rejected'. These functions run as
-- their owner (a non-login role), so current_user is neither 'authenticated' nor
-- 'anon' and the guard lets the privileged write through — the only path to a
-- decided status. The admin gate is admin_assert_role(..., {'super_admin'}),
-- which raises 42501 for non-admins (mirrors admin_org_application_decide).
--
-- Mapped to spec: FR-GLOWE-003 (org approval workflow),
--   docs/SSOT/spec/17_glowe_frontend.md.

set search_path = public;

-- ── 1. Approve / reject a pending organization ──────────────────────────────
create or replace function public.glowe_set_org_approval(
  p_profile_id uuid,
  p_decision   text,
  p_note       text default null
)
returns public.glowe_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row   public.glowe_profiles;
begin
  -- Gate: super-admins only. Raises 42501 otherwise.
  perform public.admin_assert_role(v_actor, array['super_admin']);

  if p_decision not in ('approved', 'rejected') then
    raise exception 'glowe: decision must be approved or rejected, got %', p_decision
      using errcode = '22023';
  end if;

  select * into v_row
    from public.glowe_profiles
   where id = p_profile_id
   for update;
  if not found then
    raise exception 'glowe: profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if v_row.account_type is distinct from 'organization' then
    raise exception 'glowe: profile % is not an organization', p_profile_id
      using errcode = '22023';
  end if;
  if v_row.approval_status <> 'pending' then
    raise exception 'glowe: profile % is not pending (currently %)',
      p_profile_id, v_row.approval_status using errcode = '22023';
  end if;

  update public.glowe_profiles
     set approval_status = p_decision,
         org_reviewed_at = now(),
         org_reviewed_by = v_actor,
         org_review_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_profile_id
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.glowe_set_org_approval(uuid, text, text) is
  'Super-admin only: approve/reject a pending GloWe organization. Raises 42501 for non-admins.';

revoke execute on function public.glowe_set_org_approval(uuid, text, text) from public;
grant  execute on function public.glowe_set_org_approval(uuid, text, text) to authenticated;

-- ── 2. List the pending-organization review queue ───────────────────────────
-- Exposed as an RPC (rather than a raw public-read query) so the Admin page has
-- an admin-gated read path, leaving room to later tighten the public SELECT on
-- glowe_profiles without breaking the review UI. Ordered oldest-submission first.
create or replace function public.glowe_list_pending_orgs()
returns setof public.glowe_profiles
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_role(auth.uid(), array['super_admin']);

  return query
    select *
      from public.glowe_profiles
     where account_type = 'organization'
       and approval_status = 'pending'
     order by org_submitted_at asc nulls last;
end;
$$;

comment on function public.glowe_list_pending_orgs() is
  'Super-admin only: GloWe organizations awaiting review (approval_status=pending).';

revoke execute on function public.glowe_list_pending_orgs() from public;
grant  execute on function public.glowe_list_pending_orgs() to authenticated;
