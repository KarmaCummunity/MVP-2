-- 0229_drop_glowe_org_applications_orphans — TD-174(1)
--
-- Removes the ad-hoc GloWe org-approval objects that exist ONLY on the dev
-- Supabase project (roeefqpdbftlndzsvhfj), applied directly via MCP and never
-- captured in a repo migration. The canonical org-approval path is column-based
-- on glowe_profiles (0205 approval_status + 0206 glowe_set_org_approval /
-- glowe_list_pending_orgs, reviewer-gated by is_glowe_admin) — these predate it.
--
-- The orphan cluster (verified 2026-07-06, all self-contained):
--   * table  public.glowe_org_applications (0 rows) + its 2 RLS policies
--     (glowe_org_apps_select / glowe_org_apps_insert_own) — dropped via CASCADE,
--   * enum   public.glowe_application_status — used only by the table's `status`
--     column and by no routine, so it must be dropped explicitly (CASCADE on the
--     table does not remove a type),
--   * funcs  glowe_admin_approve_org / glowe_admin_reject_org / glowe_is_admin.
-- Verified safe: zero repo references (code + migrations), and the only DB
-- dependent outside the cluster is nil — glowe_is_admin() is referenced by no
-- other policy/routine/view; the enum is used by no other column/routine.
--
-- Every statement is IF EXISTS, so this is a harmless no-op on any environment
-- that never carried the orphans (CI + prod fresh rebuilds).

begin;

drop table if exists public.glowe_org_applications cascade; -- migration-safety: allow (dev-only orphan drift, TD-174; zero external deps verified)
drop function if exists public.glowe_admin_approve_org(uuid);
drop function if exists public.glowe_admin_reject_org(uuid, text);
drop function if exists public.glowe_is_admin();
drop type if exists public.glowe_application_status;

commit;
