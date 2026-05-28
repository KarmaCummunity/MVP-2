# 2.12 Super Admin (in-chat moderation)

> **Status:** 🟡 In progress — FR-ADMIN-001..017 ✅ shipped; FR-ADMIN-018..020 ⏳ planned (P3.A3/A4). **P3.A0 + P3.A1 + Pre-A2 Hardening + P3.A2 all merged to `dev` as of 2026-05-28** (PRs #384, #385, #387, #394 + this PR). The portal infrastructure is production-ready for moderator/support roles: `admin_role_grants` table with PRD V2-wide role enum + partial-unique single-super_admin index (closes TD-95); `has_admin_role` / `admin_assert_role` SQL predicates wired into every moderation RPC (`admin_remove_post`, `admin_dismiss_report`, `admin_confirm_report`, `admin_restore_target`, `admin_delete_message`); `(admin)` route group with `AdminGate` redirect + responsive `AdminNav` + 7 nav entries (Reports live; Tasks/Admins/Users/Posts/Audit as A2..A4 stubs); reports inbox + per-case detail with permission-gated actions consuming the `@kc/domain` `PERMISSION_MATRIX` SSOT; chat-flow coexistence behind `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS` flag; auto-removal protected by 14-day freshness window; 7 legacy `useIsSuperAdmin` callsites migrated to `hasPermission()`. **Closed TDs:** TD-95 (single-super-admin DB invariant), TD-94 #2 / #4 / #5 / #6 (already-moderated error / cascade-dismiss / audit metadata parity / freshness window). **Open TDs in this domain:** TD-93 (admin search visibility — closes in P3.A4); TD-94 #1 now by design per D-41 (tickets ≠ reports); TD-94 #3 (`is_post_visible_to` admin bypass — closes in P3.A4). **Suspect-queue producers (FR-MOD-008)** and **90-day re-registration block (FR-ADMIN-003 AC3)** deferred to TECH_DEBT. **Next:** P3.A2 RBAC management (FR-ADMIN-015..017) — gives super_admin a UI to grant moderator/support roles without raw SQL. See `docs/superpowers/specs/2026-05-25-admin-portal-design.md` for A2..A4 design and `docs/SSOT/audit/2026-05-16/05_following_moderation_admin.md` for the original audit.



Prefix: `FR-ADMIN-*`

---

## Scope

The Super Admin is a single privileged account (`karmacommunity2.0@gmail.com`) that performs all moderation operations through the existing chat surface — there is no dedicated admin UI in MVP. This section defines:

- The "system message" payloads injected into the Super Admin's inbox.
- The inline actions on those messages (restore, dismiss, escalate).
- Manual moderation actions performed by the Super Admin from regular UI surfaces while signed in to that account.
- Authorization checks that gate admin-only behavior.

---

## FR-ADMIN-001 — Receiving content reports as system messages

**Description.**
Every `Report` (except `target_type = none` which becomes a support thread directly) results in a system message in the Super Admin's inbox.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2, `04_User_Flows.md` Flow 9 (תהליך פנימי).
- Constraints: `R-MVP-Privacy-4`, `R-MVP-Privacy-5`.

**Acceptance Criteria.**
- AC1. The system message is delivered into a dedicated `Chat` between the reporter and the Super Admin (the report itself does not open a thread; this is the channel where the admin sees moderation operations).
- AC2. Payload contains: target type, target ID, reporter `display_name`, reason, optional note, deep-link to the target's surface, and the current report count toward the auto-removal threshold.
- AC3. Each new report on the same target appends a new message to the same channel; the messages are sequenced by `created_at`.
- AC4. The system messages render in the chat UI with a distinct visual style (icon, light-shaded background) and inline action buttons (`FR-ADMIN-002`, `FR-ADMIN-003`).

**Related.** Domain: `Message.kind = system`, `Report`.

---

## FR-ADMIN-002 — Auto-removal alert with restore action

**Description.**
When a target reaches the 3-report threshold and is auto-removed, a system message is appended with a "↩ Restore" inline action.

**Source.**
- PRD: `04_User_Flows.md` Flow 9.A.
- Constraints: `R-MVP-Privacy-5`.

**Acceptance Criteria.**
- AC1. The message is appended within the same Super Admin channel that received the underlying reports.
- AC2. Tapping "↩ Restore" reverses the auto-removal:
   - For `target_type = post`: status returns to `open`; the post is re-listed in feeds and the owner notified.
   - For `target_type = user`: `account_status = active`; the user can sign in again.
   - For `target_type = chat`: the chat is unhidden for both parties.
- AC3. Restore actions are idempotent and audit-logged.
- AC4. After restore, the corresponding `Report` rows are stamped `dismissed_no_violation`, which feeds into `FR-MOD-010`.

**Related.** Domain: `Post`, `User`, `Chat`, `Report`.

---

## FR-ADMIN-003 — Dismiss / escalate action on a system message

**Description.**
A system message can be dismissed or escalated by the Super Admin.

**Source.**
- PRD: `04_User_Flows.md` Flow 9.A.

**Acceptance Criteria.**
- AC1. "✓ Confirm removal" stamps the linked `Report` rows as `confirmed_violation` (no further action needed; the auto-removal stands).
- AC2. "🗑 Dismiss" stamps the `Report` rows as `dismissed_no_violation` and reverts an auto-removal if one was applied.
- AC3. "Permanent ban" (only on `target_type = user`) sets `account_status = banned` and prevents the user from re-registering for 90 days.
- AC4. Each action emits an audit event.

**Related.** Domain: `Report`, `User`, `AuditEvent`.

---

## FR-ADMIN-004 — Manual ban from user profile

**Description.**
While signed in as the Super Admin, the user-profile screen exposes a "Ban user" action.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2.

**Acceptance Criteria.**
- AC1. The action is hidden for non-admin sessions (`User.is_super_admin = false`).
- AC2. Tapping it shows a modal asking for a reason (`spam`, `harassment`, `policy_violation`, `other` + free text); on confirm the target's `account_status = banned`.
- AC3. Ban is **permanent** in MVP (no scheduled unban). The user can appeal via the support thread; the admin manually flips status if accepted.
- AC4. Audit event recorded.

**Related.** Domain: `User`, `AuditEvent`.

---

## FR-ADMIN-005 — Manual delete from chat thread

**Description.**
While signed in as the Super Admin, an extra `⋮` action allows manual deletion of a specific post or message referenced in the system thread.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2.

**Acceptance Criteria.**
- AC1. The action appears as an inline button on system messages that link to a post.
- AC2. Confirms with a modal; on confirm sets the target's status to `removed_admin` (post) or hard-deletes the chat message (message).
- AC3. Audit event recorded.

---

## FR-ADMIN-006 — Authorization checks

**Description.**
Admin actions are gated by a server-side check that verifies `User.is_super_admin = true`.

**Source.**
- (Internal: required for `NFR-SEC-002` — RLS-level enforcement.)
- Constraints: `R-MVP-Safety-3`.

**Acceptance Criteria.**
- AC1. The flag is **not** trusted from the client; every admin endpoint and every RLS policy revalidates it.
- AC2. *(Amended by FR-ADMIN-017, 2026-05-28.)* At most one **active** `super_admin` grant exists at any time, enforced by the partial unique index on `admin_role_grants` (`role='super_admin' AND revoked_at IS NULL`); any number of active `moderator` and `support` grants may coexist. The `super_admin` grant is still set by direct database operation only (no UI escalation per `CLAUDE.md` §7); `moderator` and `support` grants are managed via the `(admin)/admins` portal screen (FR-ADMIN-015 / FR-ADMIN-016).
- AC3. Attempts to perform admin actions without an active grant in any allowed role fail with `FORBIDDEN` (SQLSTATE 42501).

---

## FR-ADMIN-007 — Audit visibility for the admin

**Description.**
The Super Admin can read the audit log for any user via a Settings sub-page accessible only when `is_super_admin = true`.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2.

**Acceptance Criteria.**
- AC1. The sub-page is hidden for non-admins.
- AC2. It shows the last 200 audit events of any user (lookup by ID or display name).
- AC3. Audit lines are read-only and the screen has no edit controls.

**Related.** Domain: `AuditEvent`.

---

## FR-ADMIN-008 — Database-level statistics access

**Description.**
The Super Admin retrieves global statistics directly via the database for product analytics.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2.

**Acceptance Criteria.**
- AC1. No in-app UI for global statistics in MVP; queries are run via the backend admin SQL console (Supabase Studio or psql).
- AC2. Read-only queries are allowed against all tables; mutating queries require an explicit confirmation procedure (typing a free-text confirmation string per `CLAUDE.md` §7 hard-prohibitions).

---

## FR-ADMIN-009 — Manual delete from post screen

**Description.**
While signed in as the Super Admin, the post detail screen exposes an "Remove as admin" action inside the `⋮` overflow menu, separate from the report-channel flow in `FR-ADMIN-005`.

**Source.**
- This document, §10 of `docs/superpowers/specs/2026-05-10-admin-delete-post-and-post-menu-design.md`.

**Acceptance Criteria.**
- AC1. The action is hidden for non-admin sessions. Super Admin also sees it on **their own** posts (alongside owner delete), so moderation is never blocked by ownership.
- AC2. Confirms with a modal, then sets `Post.status = 'removed_admin'`. Hard delete is **not** performed.
- AC3. Authorization is re-checked server-side via `is_admin(auth.uid())` inside a `SECURITY DEFINER` RPC; client gating is convenience only.
- AC4. An `audit_events` row is written with `action = 'manual_remove_target'`, `actor_id`, `target_type = 'post'`, `target_id = postId`.
- AC5. The action is idempotent: re-issuing it on an already-removed post is a quiet no-op and does not write a second audit row.

**Related.** Domain: `Post.status`, `AuditEvent`.

---

## §10 Admin Portal — Foundation (A0)

A0 is the foundation layer that all other Admin Portal sub-projects (A1..A4) depend on. It introduces the RBAC data model with DB-enforced invariants, the `(admin)` Expo Router group with a permission-gated layout, and stub screens for every future admin function so the nav structure is complete from day one.

Design spec: `docs/superpowers/specs/2026-05-25-admin-portal-design.md`. Implementation plan: `docs/superpowers/plans/2026-05-25-admin-portal-a0-foundation.md`. Decision: `D-40` in `DECISIONS.md`.

---

## FR-ADMIN-010 — RBAC primitives

**Description.**
Ships the extensible RBAC store (`admin_role_grants`) and the canonical SQL predicates (`has_admin_role`, `admin_assert_role`) that future write paths re-check on the server. The role enum is intentionally wide so the PRD V2 role hierarchy (operator, org_admin, …) can be granted without a schema migration. `users.is_super_admin` stays in lockstep with `admin_role_grants` via bi-directional sync triggers so the ~10 existing `useIsSuperAdmin` / `is_admin()` call sites keep working unchanged during A0.

**Source.**
- Design spec `docs/superpowers/specs/2026-05-25-admin-portal-design.md` §3.4, §3.5.
- Implementation plan `docs/superpowers/plans/2026-05-25-admin-portal-a0-foundation.md`.

**Acceptance Criteria.**
- AC1. `admin_role_grants` table + indexes + RLS policies (admins read own + all if `super_admin`; writes via RPC only).
- AC2. `has_admin_role(uid, role)` and `admin_assert_role(uid, roles[])` SQL functions.
- AC3. Migration backfills `users.is_super_admin = true` rows into `admin_role_grants` as `role = 'super_admin'`.
- AC4. `users.is_super_admin` becomes a generated column derived from `admin_role_grants` (or a view) for back-compat with existing call sites; new code uses `has_admin_role`.
- AC5. `super_admin` partial unique index enforces single-row invariant at DB level (closes `TD-95`).

**Related.** Domain: `AdminRole`, `AdminPermission` matrix. Migrations: `0112_admin_role_grants_table.sql`, `0113_admin_role_functions.sql`, `0114_admin_role_grants_backfill.sql`, `0115_get_my_admin_roles_rpc.sql`.

---

## FR-ADMIN-011 — Portal scaffold

**Description.**
A new Expo Router group `(admin)` accessible only to users with an active admin role. The dashboard is a real screen showing role badges + KPI placeholders; every other admin route (reports, tasks, admins, users, posts, audit) ships as a `ComingSoon` stub so the nav structure is locked in from A0. `AdminGate` is screen-level UX (server RPCs re-check the actor). Settings exposes an "Admin Portal" row gated on `useAdminRoles().length > 0` (so moderator + support also see it in A2+).

**Source.**
- Design spec `docs/superpowers/specs/2026-05-25-admin-portal-design.md` §3.2, §3.3.
- Implementation plan `docs/superpowers/plans/2026-05-25-admin-portal-a0-foundation.md`.

**Acceptance Criteria.**
- AC1. Expo Router group `(admin)` exists with `AdminLayout` (drawer on web ≥ md, bottom-tabs on mobile).
- AC2. `<AdminGate>` HOC + `useAdminRoles()` hook implemented and tested.
- AC3. Settings exposes an "Admin Portal" row, visible only when the session has ≥1 active role.
- AC4. `/admin` renders a stub dashboard (welcome + role badge + nav).
- AC5. i18n namespace `admin` added to `apps/mobile/src/i18n/locales/he/modules/`.

**Related.** Domain: `AdminRole`, `AdminPermission`. Application: `IAdminRoleRepository`, `GetMyAdminRolesUseCase`. Mobile: `useAdminRoles`, `AdminGate`, `AdminNav`, `ComingSoon`, `(admin)/_layout`, `(admin)/index`.

---

> **Note:** FR-ADMIN-015..020 will be added in their respective sub-project PRs (A2 RBAC management; A3 Internal Tasks; A4 Content & Users management).

---

## §11 Admin Portal — Reports Dashboard (A1)

## FR-ADMIN-012 — Reports inbox

- AC1. `/admin/reports` lists open Reports grouped by target (post/user/chat), with filters (status, target_type, days, reporter, target).
- AC2. Each row shows: target preview, # reports, oldest report age, latest reporter, threshold progress (n/3).
- AC3. Search bar accepts target ID or reporter display name; powered by `audit_search` + `reports` query.
- AC4. Default sort: oldest unresolved first.

**Related.** Database: `reports_open_inbox(...)` RPC (migration 0120). Domain: `ReportInboxPage`, `ReportInboxCursor`, `ReportInboxRow`. Application: `IReportsRepository.listOpenReports`, `ListOpenReportsUseCase`. Infrastructure: `SupabaseReportsRepository`. Mobile: `useReportsInbox` (infinite query), `ReportRow`, `ReportFilters`, `(admin)/reports/index.tsx`.

---

## FR-ADMIN-013 — Case detail

- AC1. `/admin/reports/[caseId]` shows: target deep-link, reporter list with reasons, audit timeline, current target status.
- AC2. Inline actions per RBAC matrix: Confirm removal / Dismiss / Restore / Permanent ban / Manual remove / Open support thread.
- AC3. Restore action no longer cascades-dismisses reports across unrelated cases (closes `TD-94`); each case is dismissed independently.
- AC4. All actions emit `audit_events` rows; the timeline updates optimistically + reconciles on success.

**Related.** Database: `reports_case_detail(...)` RPC (migration 0121); `admin_restore_target` rewritten in migration 0119 (per-case dismiss). Migration 0118 widens `admin_dismiss_report` / `admin_remove_post` / `admin_confirm_report` from `is_admin()` to `admin_assert_role(['super_admin','moderator'])`. Domain: `ReportCaseDetail`, `ReportCaseReporter`, `ReportCaseTimelineEntry`. Application: `IReportsRepository.getCaseDetail`, `GetReportCaseDetailUseCase`. Mobile: `useReportCaseDetail`, `CaseActions`, `CaseReporterList`, `CaseAuditTimeline`, `(admin)/reports/[caseId].tsx`.

---

## FR-ADMIN-014 — Chat-flow coexistence & deprecation

- AC1. The existing `system` message + inline buttons in chat keep working through A1's lifetime.
- AC2. Actions taken in the Portal are reflected back into the chat thread (the `system` message updates its inline status: "Resolved by @moderator-x at …").
- AC3. After A1 ships behind a flag (`ADMIN_PORTAL_REPORTS=true`), the chat-flow buttons render in read-only mode and direct the admin to the Portal.
- AC4. Chat-flow buttons are removed in a follow-up PR after one stable week (logged in `BACKLOG.md`).

**Related.** Mobile: `useAdminPortalReportsFlag` (reads `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS`); `ReportReceivedBubble` coexistence (read-only + deep-link into `/admin/reports/[caseId]` when flag is true). Implementation plan §A1.

---

> **Deprecation note (per FR-ADMIN-014):** the legacy chat-flow surface defined in **FR-ADMIN-003**, **FR-ADMIN-004**, **FR-ADMIN-005**, and **FR-ADMIN-009** is deprecated by FR-ADMIN-014; coexistence behind `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS` flag. Read-only chat buttons deep-link to the Admin Portal when the flag is true; the moderation surface lives at `/admin/reports` (FR-ADMIN-012) and `/admin/reports/[caseId]` (FR-ADMIN-013).

---

## §12 Admin Portal — RBAC management (A2)

A2 makes `moderator` and `support` grants manageable from inside the portal so the team can expand without a Supabase shell session. `super_admin` escalation remains DB-only (per `CLAUDE.md` §7 and FR-ADMIN-006 AC2 amended).

Migration: `0143_admin_rbac_management.sql`. Mobile route: `(admin)/admins`. Decision: no new D-* required — the role enum and the partial unique index were both established by A0 (D-40); A2 is a UI + RPC layer on top.

---

## FR-ADMIN-015 — Admin list

**Description.**
`(admin)/admins` lists active grants grouped by role with last-seen timestamp, and (for `super_admin`) supports toggling on revoked grants for audit visibility.

**Acceptance Criteria.**
- AC1. `(admin)/admins` lists active admins grouped by role (`super_admin`, then `moderator`, then `support`) with `display_name`, `last_seen_at`, `granted_at`, and `granted_by_display_name`.
- AC2. `super_admin` may toggle "include revoked grants" — revoked rows render dimmed with the revocation timestamp instead of last-seen.
- AC3. `moderator` sees the list read-only (no `+ Grant` button, no `Revoke` button per row); `support` does not access the route at all (deny card rendered if a stale flag lands them there).

**Related.** RPC: `admin_list_admins(p_include_revoked boolean)` returns `(grant_id, user_id, display_name, avatar_url, role, granted_at, granted_by, granted_by_display_name, revoked_at, revoked_by, last_seen_at)`. Domain: `AdminGrant`. Application: `IAdminRoleRepository.listAdmins`, `ListAdminsUseCase`. Mobile: `useAdminsList`, `AdminRow`, `(admin)/admins/index.tsx`.

---

## FR-ADMIN-016 — Grant / revoke role

**Description.**
`super_admin` can grant `moderator` or `support` to any active user via display-name lookup, and can revoke any active grant. Revoking the last active `super_admin` is blocked at both the RPC and DB-index levels.

**Acceptance Criteria.**
- AC1. The grant modal performs a debounced lookup against `users` (`account_status='active'` + `display_name ILIKE '%q%'`, limit 8) and lists matches; selecting a match plus a role enables the submit button.
- AC2. Submit calls `admin_grant_role(target_user_id, role)`; valid roles are `moderator` and `support`. Granting `super_admin` (or any PRD-V2-reserved role) is rejected server-side with `invalid_role` per `CLAUDE.md` §7 ("no UI to grant `super_admin`").
- AC3. Revoking the last active `super_admin` raises `cannot_revoke_last_super_admin` (SQLSTATE `P0001`) — the partial unique index on `admin_role_grants` ensures the invariant even if a future code path skipped the guard.
- AC4. Each grant and revoke emits an `audit_events` row (`action='admin_role_grant'` or `'admin_role_revoke'`, `target_type='user'`, `metadata={role, grant_id}`).
- AC5. Errors mapped to user-visible Hebrew strings: `forbidden`, `target_not_found`, `target_not_active`, `role_already_active`, `invalid_role`, `cannot_revoke_last_super_admin`, `grant_not_found`, `grant_already_revoked`, `invalid_input`, plus a generic `unknown` fallback.

**Related.** RPCs: `admin_grant_role(target_user_id uuid, role text) RETURNS uuid` and `admin_revoke_role(grant_id uuid) RETURNS void` (both `SECURITY DEFINER`, gated by `admin_assert_role(auth.uid(), ARRAY['super_admin'])`). Application: `GrantAdminRoleUseCase`, `RevokeAdminRoleUseCase`. Mobile: `useAdminRoleMutations`, `GrantRoleModal`.

---

## FR-ADMIN-017 — Single-super_admin invariant (replaces FR-ADMIN-006 AC2)

**Description.**
Originally `FR-ADMIN-006 AC2` read "only one row may carry `is_super_admin`". With A0's RBAC schema (`admin_role_grants` + partial unique index `role='super_admin' AND revoked_at IS NULL`), the invariant generalises to multiple roles cleanly. The amended wording is now in FR-ADMIN-006 AC2; this FR exists to record the change for traceability.

**Acceptance Criteria.**
- AC1. FR-ADMIN-006 AC2 reads: "at most one **active** `super_admin` grant; any number of active `moderator` and `support` grants."
- AC2. The partial unique index (`admin_role_grants_single_super_admin_uniq`, established in migration `0112` for FR-ADMIN-010 AC5) enforces AC1 at the DB level.
- AC3. `admin_revoke_role` adds an explicit "cannot revoke last super_admin" guard (FR-ADMIN-016 AC3) as defence in depth above the DB index — the index would otherwise let the row be revoked because revocation is an UPDATE that does not violate the partial unique index (the row leaves the partial-uniqueness set).

**Related.** Migration: `0112_admin_role_grants_table.sql` (index). Migration: `0143_admin_rbac_management.sql` (RPC guard).

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §2.2 and Flow 9. |
| 0.2 | 2026-05-10 | Added FR-ADMIN-009 (manual delete from post screen). |
| 0.3 | 2026-05-12 | `FR-ADMIN-009 AC1` — Super Admin sees *Remove as admin* on own posts too; `FR-POST-008` alignment: admin may edit any open post (RLS `0049_admin_post_edit_rls.sql`). |
| 0.4 | 2026-05-25 | Added §10 Admin Portal — Foundation (A0). FR-ADMIN-010 (RBAC primitives) and FR-ADMIN-011 (Portal scaffold). Status header ✅ → 🟡. FR-ADMIN-012..020 reserved for A1..A4. |
| 0.5 | 2026-05-26 | Added §11 Admin Portal — Reports Dashboard (A1). FR-ADMIN-012/013/014. Closed cascade-dismiss sub-item of TD-94 (migration 0119). Widened admin_dismiss_report / admin_remove_post / admin_confirm_report from `is_admin()` to RBAC (migration 0118). Added deprecation note on FR-ADMIN-003/004/005/009 referencing FR-ADMIN-014. |
| 0.6 | 2026-05-28 | Added §12 Admin Portal — RBAC management (A2). FR-ADMIN-015 (admin list), FR-ADMIN-016 (grant/revoke), FR-ADMIN-017 (amends FR-ADMIN-006 AC2 to "at most one active super_admin; any number of moderator/support"). Migration `0143_admin_rbac_management.sql` ships `admin_grant_role` + `admin_revoke_role` + `admin_list_admins` (all gated by `admin_assert_role`). |
