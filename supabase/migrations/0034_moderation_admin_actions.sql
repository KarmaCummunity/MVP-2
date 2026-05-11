-- 0034_moderation_admin_actions | P1.3 + P2.2
-- FR-MOD-007, FR-MOD-010, FR-ADMIN-002..005, FR-ADMIN-007.
--
-- Adds: reports.sanction_consumed_at column, audit_events action enum
-- additions ('ban_user','delete_message'), six admin RPCs, sign-in gate RPC,
-- statement-level sanction trigger, owner-notification side-effect on the
-- existing reports_after_insert_apply_effects trigger.
--
-- All admin RPCs run SECURITY DEFINER, set search_path, re-check is_admin()
-- inside the body, and grant EXECUTE only to the authenticated role.

-- ── 1. Schema additions ────────────────────────────────────────────────────

alter table public.reports
  add column if not exists sanction_consumed_at timestamptz;

create index if not exists reports_reporter_window_idx
  on public.reports (reporter_id, status, resolved_at)
  where status = 'dismissed_no_violation' and sanction_consumed_at is null;

-- Replace the audit_events action CHECK using NOT VALID + VALIDATE pattern to
-- avoid an ACCESS EXCLUSIVE table scan during application of the new check.
-- Order: add new (no scan) → validate (shares lock) → drop old (brief excl) →
-- rename (atomic, brief excl). Total time at heavy lock is minimal.
alter table public.audit_events
  add constraint audit_events_action_check_v2 check (action in (
    'block_user','unblock_user',
    'report_target',
    'auto_remove_target','manual_remove_target','restore_target',
    'suspend_user','unsuspend_user',
    'ban_user',
    'false_report_sanction_applied',
    'dismiss_report','confirm_report',
    'delete_message'
  )) not valid;

alter table public.audit_events
  validate constraint audit_events_action_check_v2;

alter table public.audit_events
  drop constraint if exists audit_events_action_check;

alter table public.audit_events
  rename constraint audit_events_action_check_v2 to audit_events_action_check;
