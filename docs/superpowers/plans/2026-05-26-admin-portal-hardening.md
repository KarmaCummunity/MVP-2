# Admin Portal — Pre-A2 Foundation Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Close the structural gaps that would make A2 (role management) ship half-broken. After this PR: moderators granted a role can actually use every UI surface and every server RPC; the inbox doesn't show stale data after admin actions; auto-removal threshold has a freshness window; restore audit metadata is consistent.

**Architecture:**
- Backend: widen `admin_delete_message` to RBAC. Add freshness window to the 3-distinct-reporter threshold. Fix restore audit metadata. Clarify the "already moderated" error.
- Domain: add `chat.delete_message` permission to `PERMISSION_MATRIX`.
- Mobile: replace 7 `useIsSuperAdmin` callsites with `hasPermission()` against the permission matrix. Wire cache invalidation in case actions so the inbox refreshes after a mutation. Move admin UI from hardcoded colors to design tokens.

**Tech Stack:** Same as A0/A1.

**SSOT mapping:** Closes TD-94 sub-items (2), (5), (6). Hardens FR-ADMIN-010..014 enforcement. No new FR-IDs.

**Out of scope (deferred):**
- TD-94 (1) — `rpc_submit_support_issue` writing to `reports`. Confirmed by-design: tickets ≠ reports.
- TD-94 (3) — `is_post_visible_to` admin bypass. A4 territory (admin search).
- Realtime subscription on `reports`. Cache invalidation is sufficient for A2 traffic.
- Donation-link reports unification. Confirmed by-design.

---

## File structure

### Database migrations

| File | Responsibility |
|---|---|
| `0122_admin_delete_message_rbac.sql` | Widen `admin_delete_message` to `admin_assert_role(['super_admin','moderator'])`. |
| `0123_reports_freshness_window.sql` | Auto-removal counts only reports `created_at >= now() - interval '14 days'`. |
| `0124_admin_restore_target_audit_parity.sql` | Restore audit metadata includes `{distinct_reporters: [...]}` like auto-remove. |
| `0125_reports_validate_already_moderated_error.sql` | Distinct SQLSTATE / message for "target already moderated" vs "not visible". |

### Domain (under `app/packages/domain/src/admin/`)

| File | Change |
|---|---|
| `AdminPermission.ts` | Add `'chat.delete_message': ['super_admin','moderator']` to `PERMISSION_MATRIX` + `ADMIN_PERMISSIONS`. |
| `__tests__/AdminPermission.test.ts` | Add a coverage line for the new permission. |

### Mobile — 7 callsite migrations

| File | Old gate | New gate |
|---|---|---|
| `src/components/post/PostMenuButton.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.manual_remove_post')` |
| `src/components/profile/ProfileOverflowMenu.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.permanent_ban')` for the ban entry; `roles.length > 0` for the broader menu visibility |
| `src/components/MessageBubble.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'chat.delete_message')` |
| `src/components/DonationLinksList.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.manual_remove_post')` (donation links are post-tied) |
| `src/components/chat/system/ReportReceivedBubble.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.view')` |
| `src/components/chat/system/AutoRemovedBubble.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.view')` |
| `src/components/chat/system/DonationLinkReportedBubble.tsx` | `useIsSuperAdmin()` | `hasPermission(roles, 'reports.view')` |

The `useIsSuperAdmin` hook itself is NOT removed — it stays alive for any legacy callers we haven't migrated and for the seed/onboarding paths. Future PR can deprecate it.

### Mobile — inbox cache invalidation

`src/components/admin/reports/CaseActions.tsx` gets a `queryClient.invalidateQueries({ queryKey: ['admin.reports.inbox'] })` call after every successful action, so the inbox refetches when the user returns. Use `useQueryClient()` from `@tanstack/react-query`.

### Mobile — design tokens

Replace hardcoded hex colors in admin UI files with tokens from `@kc/ui`:
- `#eef2ff` → `secondaryLight`
- `#eee` / `#f5f5f5` / `#fafafa` → `border` / `skeleton` / `surface` (closest semantic match)
- `#fee2e2` / `#7f1d1d` → `errorLight` / `error`

Files: `AdminNav.tsx`, `ReportFilters.tsx`, `CaseReporterList.tsx`, `CaseActions.tsx`, `CaseAuditTimeline.tsx`, `(admin)/index.tsx`, `(admin)/reports/[caseId]/index.tsx`.

### SSOT updates

| File | Change |
|---|---|
| `docs/SSOT/TECH_DEBT.md` | Close TD-94 sub-items (2), (5), (6). |
| `docs/SSOT/DECISIONS.md` | Add D-41: "Tickets (support_issues) intentionally do not populate `reports`. The two surfaces are kept separate." |

### Branch & PR

- Branch: `chore/FR-ADMIN-hardening-pre-a2`
- PR title: `chore(admin): pre-a2 foundation hardening — rbac coverage, td-94 closures, ui tokens`
- Base: `dev`

---

## Tasks

### Pre-task setup

```bash
cd /Users/navesarussi/Desktop/MVP-2
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c chore/FR-ADMIN-hardening-pre-a2
```

Verify next free migration prefix:
```bash
ls supabase/migrations/ | sort | tail -3
```
Plan assumes `0122..0125` are free. Shift if needed.

---

### Task 1: Migration `0122_admin_delete_message_rbac.sql`

**Files:** Create `supabase/migrations/0122_admin_delete_message_rbac.sql`.

The existing `admin_delete_message` (migration 0037) uses `if not public.is_admin(v_actor) then raise ...`. Read the file first to preserve every other semantic (the message-kind check, the audit insert, error codes).

- [ ] **Step 1: Read existing function**

```bash
grep -A 60 "function public.admin_delete_message" supabase/migrations/0037_admin_ban_delete_message.sql
```

- [ ] **Step 2: Write the new migration**

Rewrite the entire function body. Preserve:
- All argument names + types.
- The check that the message kind is NOT `'system'` (cannot delete system messages — preserve the exact SQLSTATE).
- The audit-event insert with the same `action` value and metadata shape.

Change only:
- The role check at the top: replace `if not public.is_admin(v_actor) ...` with `perform public.admin_assert_role(v_actor, array['super_admin','moderator']);`.

End the migration with:
```sql
revoke execute on function public.admin_delete_message(uuid) from public;
grant  execute on function public.admin_delete_message(uuid) to authenticated;
```

- [ ] **Step 3: Apply + verify + commit**

```bash
source ~/.kc-dev-secrets.env 2>/dev/null || true
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.admin_delete_message'::regproc::oid);" | head -40
```
Expected: body uses `admin_assert_role`, NOT `is_admin`.

```bash
git add supabase/migrations/0122_admin_delete_message_rbac.sql
git commit -m "feat(admin): widen admin_delete_message to RBAC

Aligns with PERMISSION_MATRIX[chat.delete_message] = [super_admin, moderator].
Preserves all other existing semantics (system-message guard, audit insert).

Mapped to: FR-ADMIN-010, FR-ADMIN-013."
```

---

### Task 2: Migration `0123_reports_freshness_window.sql` (closes TD-94 #6)

The trigger `reports_after_insert_apply_effects` (migration 0047) counts distinct reporters with `status='open'` regardless of age. A report opened a year ago can tip a target into auto-removal today. Add a freshness window: only count reports `created_at >= now() - interval '14 days'`.

**Files:** Create `supabase/migrations/0123_reports_freshness_window.sql`.

- [ ] **Step 1: Read existing trigger**

```bash
grep -A 200 "function public.reports_after_insert_apply_effects" supabase/migrations/0047_report_admin_payload_enrichment.sql | head -200
```

Note: the trigger function may be defined in `0005` and overridden in `0047`. Find the latest definition before writing.

- [ ] **Step 2: Write the migration**

The migration is a full `create or replace function ...` of the latest definition, with ONE change: the distinct-reporter count query restricts `created_at >= now() - interval '14 days'`.

Preserve every other line — auto-removal status updates, audit metadata payload, the `report_received` system message injection, etc.

Add a comment at the top explaining the change.

- [ ] **Step 3: Apply + verify + commit**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.reports_after_insert_apply_effects'::regproc::oid);" | grep -A 3 "interval '14 days'"
```
Expected: shows the new freshness clause.

```bash
git add supabase/migrations/0123_reports_freshness_window.sql
git commit -m "fix(admin): auto-removal threshold counts only reports within 14 days

Closes TD-94 (6). Prevents a year-old open report from tipping a target
into auto-removal when a new report arrives today.

Mapped to: FR-MOD-001."
```

---

### Task 3: Migration `0124_admin_restore_target_audit_parity.sql` (closes TD-94 #5)

`admin_restore_target` (migration 0119) writes an audit row with empty `metadata`. Auto-remove writes `{distinct_reporters: [uuid, uuid, uuid]}`. For an admin investigating a target's history, the asymmetry is confusing.

**Files:** Create `supabase/migrations/0124_admin_restore_target_audit_parity.sql`.

- [ ] **Step 1: Write the migration**

Rewrite `admin_restore_target` once more — same body as 0119, but the audit insert now collects the list of reporter UUIDs that triggered the auto-removal (the open reports at the time of restore) and includes them in metadata.

```sql
-- snippet of the audit insert (replace the existing one):
declare
  v_reporters uuid[];
begin
  -- ... existing role check, status updates ...

  if not found then return; end if;

  select coalesce(array_agg(distinct reporter_id), array[]::uuid[])
    into v_reporters
    from public.reports
   where target_type = p_target_type
     and target_id   = p_target_id
     and status      = 'open';

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'restore_target', p_target_type, p_target_id,
          jsonb_build_object('distinct_reporters', to_jsonb(v_reporters)));
end;
```

- [ ] **Step 2: Apply + verify + commit**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.admin_restore_target'::regproc::oid);" | grep -A 3 "distinct_reporters"
```

```bash
git add supabase/migrations/0124_admin_restore_target_audit_parity.sql
git commit -m "fix(admin): restore audit metadata includes distinct_reporters

Closes TD-94 (5). Symmetry with auto_remove_target's metadata payload.

Mapped to: FR-ADMIN-007."
```

---

### Task 4: Migration `0125_reports_validate_already_moderated_error.sql` (closes TD-94 #2)

`reports_validate_before_insert` (migration 0005) raises `report_target_not_visible` (a generic visibility error) when a user tries to report a target that's already been moderated. The user sees a confusing message. Add a distinct SQLSTATE / message for the "already moderated" case.

**Files:** Create `supabase/migrations/0125_reports_validate_already_moderated_error.sql`.

- [ ] **Step 1: Read the existing validator**

```bash
grep -A 80 "function public.reports_validate_before_insert" supabase/migrations/0005_init_moderation.sql
```

- [ ] **Step 2: Write the migration**

Rewrite `reports_validate_before_insert`. Before the existing visibility check, add:

```sql
-- Already moderated? Surface a distinct error.
if p_target_type = 'post' and exists (
  select 1 from public.posts
   where post_id = p_target_id
     and status = 'removed_admin'
) then
  raise exception 'target_already_moderated' using errcode = 'P0020';
end if;

if p_target_type = 'user' and exists (
  select 1 from public.users
   where user_id = p_target_id
     and account_status in ('suspended_admin','banned')
) then
  raise exception 'target_already_moderated' using errcode = 'P0020';
end if;

if p_target_type = 'chat' and exists (
  select 1 from public.chats
   where chat_id = p_target_id
     and removed_at is not null
) then
  raise exception 'target_already_moderated' using errcode = 'P0020';
end if;
```

Then keep the rest of the function intact.

Update the application-layer error mapping in `app/packages/infrastructure-supabase/src/reports/SupabaseReportRepository.ts` to recognize `P0020` → `ReportAlreadyModeratedError` (add this error class if it doesn't exist).

Update the i18n strings to localize the new error.

- [ ] **Step 3: Apply + verify + commit**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.reports_validate_before_insert'::regproc::oid);" | grep "P0020"
```

```bash
git add supabase/migrations/0125_reports_validate_already_moderated_error.sql \
        app/packages/infrastructure-supabase/src/reports/SupabaseReportRepository.ts \
        app/apps/mobile/src/i18n/locales/he/modules/postReport.ts
git commit -m "fix(admin): distinct error for already-moderated targets

Closes TD-94 (2). Users now see a clear 'target already moderated'
message instead of the misleading 'not visible' error.

Mapped to: FR-MOD-001."
```

---

### Task 5: Integration tests for hardening migrations

**Files:** Create `app/packages/infrastructure-supabase/src/admin/__tests__/hardeningRpc.integration.test.ts`.

- [ ] **Step 1: Write 5 tests**

1. `admin_delete_message` succeeds for a moderator (was super_admin only).
2. Auto-removal: insert 3 reports with `created_at = now() - interval '20 days'` plus a 4th today; verify auto-removal does NOT trigger because the 3 older ones are outside the freshness window.
3. Auto-removal: insert 3 fresh reports → triggers, then call `admin_restore_target`. Verify the audit row's `metadata.distinct_reporters` contains all 3 reporter UUIDs.
4. Try to report a post already in `removed_admin` status — expect SQLSTATE `P0020`.
5. (Regression) The original "report_target_not_visible" error still fires when a user tries to report a target they can't see (privacy gate).

Follow the same idempotency pattern as `adminRoleRpc.integration.test.ts` (revoke pre-existing super_admin in `beforeAll`, restore in `afterAll`).

- [ ] **Step 2: Run**

```bash
source ~/.kc-dev-secrets.env 2>/dev/null || true
NODE_OPTIONS=--experimental-websocket pnpm --filter @kc/infrastructure-supabase test -- hardeningRpc
```
Expected: 5/5 pass.

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/admin/__tests__/hardeningRpc.integration.test.ts
git commit -m "test(admin): hardening migrations integration coverage

Mapped to: TD-94 #2, #5, #6 closures."
```

---

### Task 6: Domain — add `chat.delete_message` permission

**Files:**
- Modify: `app/packages/domain/src/admin/AdminPermission.ts`
- Modify: `app/packages/domain/src/admin/__tests__/AdminPermission.test.ts`

- [ ] **Step 1: Update the matrix**

Add `'chat.delete_message'` to `ADMIN_PERMISSIONS` (after `'reports.admin_edit_post'`) and to `PERMISSION_MATRIX` with value `['super_admin', 'moderator']`.

- [ ] **Step 2: Update the test**

Add a test:
```typescript
it('chat.delete_message is granted to super_admin and moderator only', () => {
  expect(hasPermission(['super_admin'], 'chat.delete_message')).toBe(true);
  expect(hasPermission(['moderator'], 'chat.delete_message')).toBe(true);
  expect(hasPermission(['support'], 'chat.delete_message')).toBe(false);
  expect(hasPermission([], 'chat.delete_message')).toBe(false);
});
```

- [ ] **Step 3: Run + commit**

```bash
cd app && pnpm --filter @kc/domain test -- AdminPermission
git add app/packages/domain/src/admin/AdminPermission.ts \
        app/packages/domain/src/admin/__tests__/AdminPermission.test.ts
git commit -m "feat(domain): add chat.delete_message permission

Mapped to: FR-ADMIN-010."
```

---

### Tasks 7–13: Migrate 7 `useIsSuperAdmin` callsites

Each task is a single-file change:
1. Add an import: `import { useAdminRoles } from '../hooks/useAdminRoles';` (adjust relative depth).
2. Add: `import { hasPermission } from '@kc/domain';`
3. Replace `const isSuperAdmin = useIsSuperAdmin();` with:
```typescript
const { roles } = useAdminRoles();
const canDoX = hasPermission(roles as readonly AdminRole[], '<the.permission>');
```
4. Replace all `isSuperAdmin` references with `canDoX`.
5. typecheck + commit.

Apply per the table in the File Structure section.

- [ ] **Task 7: `PostMenuButton.tsx`** — permission `'reports.manual_remove_post'`. Commit: `"feat(mobile): PostMenuButton uses RBAC permission, not is_super_admin"`.
- [ ] **Task 8: `ProfileOverflowMenu.tsx`** — permission `'reports.permanent_ban'` for the ban entry; menu visibility on `roles.length > 0`. Commit.
- [ ] **Task 9: `MessageBubble.tsx`** — permission `'chat.delete_message'`. Commit.
- [ ] **Task 10: `DonationLinksList.tsx`** — permission `'reports.manual_remove_post'`. Commit.
- [ ] **Task 11: `ReportReceivedBubble.tsx`** — permission `'reports.view'`. The coexistence logic from A1 stays. Commit.
- [ ] **Task 12: `AutoRemovedBubble.tsx`** — permission `'reports.view'`. Commit.
- [ ] **Task 13: `DonationLinkReportedBubble.tsx`** — permission `'reports.view'`. Commit.

After Task 13, run:
```bash
cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile test
```
Expected: PASS.

---

### Task 14: Cache invalidation on case actions

**Files:** Modify `app/apps/mobile/src/components/admin/reports/CaseActions.tsx`.

- [ ] **Step 1: Wire `queryClient.invalidateQueries`**

Add an import:
```typescript
import { useQueryClient } from '@tanstack/react-query';
```

Inside `CaseActions`, after the existing hooks:
```typescript
const queryClient = useQueryClient();
```

In `run(action)`, in the `finally` block (or right after the await succeeds), before `onActed()`:
```typescript
await queryClient.invalidateQueries({ queryKey: ['admin.reports.inbox'] });
```

This forces the inbox to refetch when the user navigates back. The case-detail query is invalidated by `onActed → refetch()` already; this adds the inbox.

- [ ] **Step 2: Run + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/admin/reports/CaseActions.tsx
git commit -m "fix(admin): case actions invalidate inbox query

After dismiss/confirm/restore in case detail, returning to the inbox now
shows fresh data without manual pull-to-refresh.

Mapped to: FR-ADMIN-012."
```

---

### Task 15: Replace hardcoded colors with design tokens

**Files:** Modify each of the listed admin UI files.

- [ ] **Step 1: Find the tokens to use**

Read `app/packages/ui/src/theme/colors.ts` and identify the closest semantic match for each hex:
- `#eee` → `border` (or `surfaceVariant` if that exists)
- `#f5f5f5` → `skeleton` (or `surface` / a neutral)
- `#fafafa` → `skeleton` / `surface`
- `#eef2ff` → `secondaryLight` (per the explore agent's note)
- `#fee2e2` → `errorLight`
- `#7f1d1d` → `error`

If the token names differ in the actual file, pick the closest semantic equivalent. Do NOT introduce new tokens in this PR.

- [ ] **Step 2: Migrate each file**

For each file, import:
```typescript
import { useTheme } from '@kc/ui';  // OR the exact existing pattern
```

Move the StyleSheet from a module-level constant into a hook-level `useMemo(() => StyleSheet.create({...}), [colors])` that reads from `useTheme()`. If the file uses many style references and refactoring is fiddly, use a `getStyles(theme)` helper function instead. Match the pattern of the closest existing themed component.

If `useTheme()` is not the established pattern (some files use direct color imports), follow the existing convention.

- [ ] **Step 3: Verify visually**

Cannot do manual smoke. Run typecheck + lint:
```bash
cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint
```

- [ ] **Step 4: Commit (one commit per file is fine, or one combined commit if changes are mechanical)**

```bash
git add app/apps/mobile/src/components/admin/AdminNav.tsx \
        app/apps/mobile/src/components/admin/reports/*.tsx \
        'app/apps/mobile/app/(admin)/index.tsx' \
        'app/apps/mobile/app/(admin)/reports/[caseId]/index.tsx'
git commit -m "refactor(mobile): admin UI uses @kc/ui design tokens

Removes 12 hardcoded hex colors across AdminNav, ReportFilters,
CaseReporterList, CaseActions, CaseAuditTimeline, dashboard, and case
detail screens.

Mapped to: FR-ADMIN-011."
```

---

### Task 16: SSOT updates

**Files:**
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/DECISIONS.md`

- [ ] **Step 1: TD-94 cleanup**

In TD-94's cluster row, mark sub-items (2), (5), (6) as closed with references to the migration files. If after these closures only (1) and (3) remain open AND (1) is marked "by design" per D-41 below, consider splitting the cluster into two rows: one closed (this PR), one remaining as TD-94' or similar.

- [ ] **Step 2: Add D-41**

Append:
```markdown
### D-41 — Support issues (Settings → "Report an issue") intentionally do not populate `public.reports`

**Date:** 2026-05-26
**Status:** Accepted

**Decision.** Support tickets submitted via `rpc_submit_support_issue` continue to flow exclusively into a 1:1 support chat with the super admin (system message kind `'support_issue'`). They do NOT INSERT into `public.reports` and therefore do not appear in the Admin Portal Reports Dashboard (FR-ADMIN-012).

**Rationale.** Tickets and moderation reports have different lifecycles, different escalation paths, and different audit needs. Conflating them into a single inbox would force the moderation UI to handle a payload it isn't designed for (free-text description, no target). When A3 Internal Tasks lands, the admin team will track ticket follow-ups there.

**Implication.** The two surfaces stay separate: moderation work happens in `/admin/reports`; tickets stay in the support chat and (eventually) in `/admin/tasks`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/SSOT/TECH_DEBT.md docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): close TD-94 #2, #5, #6 and add D-41 (tickets vs reports)"
```

---

### Task 17: Full verification

- [ ] **Step 1: Gates**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck
source ~/.kc-dev-secrets.env 2>/dev/null || true
NODE_OPTIONS=--experimental-websocket pnpm test
pnpm lint
```
Expected: all green. The new `hardeningRpc.integration.test.ts` (5 tests) + the existing `adminRoleRpc` (9) + `reportsRpc` (11) all pass.

- [ ] **Step 2: Document manual smoke deferral**

Per autonomous-loop ethos, no manual smoke. The PR body notes this; the PM can spot-check by:
1. Granting themselves a moderator role (via SQL since A2 isn't built yet) and verifying every admin button now appears for them (PostMenuButton remove, ProfileOverflowMenu ban entry, etc.).
2. Reporting a post twice from one user — expects 1st report succeeds, 2nd raises a clear "already moderated" message.
3. Dismissing a case in case detail — returns to inbox; the dismissed row is gone without manual refresh.

---

### Task 18: Push + PR + auto-merge

- [ ] **Step 1: Rebase**

```bash
git fetch origin
git rebase origin/dev
```

If migration prefix conflicts: shift `0122..0125` to next free block, update commit messages + the integration test if it references prefixes.

- [ ] **Step 2: Push + open PR (lowercase title)**

```bash
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "chore(admin): pre-a2 foundation hardening — rbac coverage, td-94 closures, ui tokens" \
  --body "$(cat <<'EOF'
## Summary
Pre-A2 hardening pass: widens admin_delete_message to RBAC, migrates 7 mobile callsites from useIsSuperAdmin to the PERMISSION_MATRIX, invalidates the inbox query after case actions, adds a 14-day freshness window to the auto-removal threshold, fixes restore audit metadata parity, surfaces a distinct error for already-moderated targets, and replaces 12 hardcoded hex colors with @kc/ui design tokens. After this PR, moderators granted a role in A2 can actually use every UI surface and every server RPC the matrix promises.

## Mapped to spec
- FR-ADMIN-010..014 enforcement hardening (no new FR-IDs).
- TD-94 sub-items (2), (5), (6) closed.
- D-41 documents the intentional separation of support tickets vs moderation reports.

## Changes
- 4 migrations (0122 admin_delete_message RBAC, 0123 freshness window, 0124 restore audit parity, 0125 already-moderated error).
- Domain: chat.delete_message permission added to the matrix.
- Mobile: 7 callsite migrations to hasPermission(), inbox cache invalidation, design tokens across 7 admin UI files.
- SSOT: TD-94 #2/#5/#6 closed, D-41 added.

## Tests
- pnpm typecheck ✅
- pnpm test ✅ (5 new hardening tests, all existing pass)
- pnpm lint ✅

## SSOT updated
- [x] TECH_DEBT.md — TD-94 #2/#5/#6 closed
- [x] DECISIONS.md — D-41 added

## Risk / rollout notes
4 forward-only migrations. The freshness window is a behavior change for auto-removal (year-old reports no longer count) — verified by the new integration test. The "already moderated" error is a NEW SQLSTATE (P0020); the SDK error mapping recognizes it. Color migration is visual only.
EOF
)" \
  --label "FR-ADMIN" --assignee "@me"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

If CI fails: investigate, up to 3 fix attempts. Then report BLOCKED.

After merge: `git switch dev && git pull --ff-only origin dev`.

---

## Self-review checklist

- **TD-94 closures:** Migrations 0123 (freshness), 0124 (audit parity), 0125 (error) each close one sub-item. Integration tests cover each. ✅
- **RBAC coverage:** admin_delete_message widened; chat.delete_message added to matrix; MessageBubble migrated to permission gate. The chain is closed. ✅
- **Cache freshness:** inbox invalidation in CaseActions; verified manually by reading the hook. ✅
- **No new placeholders / TODOs.**
- **No accidental edits to A0/A1 files** beyond the listed callsite migrations and the cascade of `admin_restore_target` (which is the same function A1 created — Task 3 is a follow-up `create or replace`).
