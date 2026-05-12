# Moderation + Super-Admin Actions — Design

**Date:** 2026-05-12 · **Version:** 0.2 (post-council-review)
**Status:** Approved (PM)
**Scope (BACKLOG):** P1.3 (Reports + auto-removal + false-report sanctions) + P2.2 (Super-admin moderation queue, scope variant **B**)
**Specs touched:** `08_moderation.md` (FR-MOD-007, FR-MOD-010 v0.3), `12_super_admin.md` (FR-ADMIN-002..005, FR-ADMIN-007)

---

## 1. Goals

Close the gap between the DB-side moderation infrastructure (already shipped in migrations 0005, 0013, 0020) and a usable end-to-end flow for:

1. Reporting a user from a profile (FR-MOD-007).
2. Super-admin handling content reports inline in chat: restore, dismiss, confirm, ban (FR-ADMIN-002, FR-ADMIN-003).
3. Manual ban from a user profile (FR-ADMIN-004).
4. Manual delete from a chat thread — both linked-post and chat-message (FR-ADMIN-005).
5. Audit visibility sub-page in Settings (FR-ADMIN-007).
6. False-report sanction escalation: 7d → 30d → permanent (FR-MOD-010 v0.3).
7. Account-status sign-in gate that respects suspensions/bans.

## 2. Out of scope (deferred to TECH_DEBT)

- **FR-MOD-008** — Suspect queue producers (`excessive_reopens`, `forbidden_keyword`, `manual_flag`). Table exists; producers deferred.
- **FR-ADMIN-003 AC3** — 90-day re-registration block after permanent ban.
- **Cron-based suspension expiry** — restore lazily at sign-in attempt instead.
- **Push notification of moderation events** — depends on P1.5; in-app system message in the meantime.

## 3. What already exists (do not re-implement)

**Database (migrations 0005, 0013, 0020):**
- Tables: `reports`, `audit_events`, `reporter_hides`, `moderation_queue_entries`.
- Triggers: `reports_validate_before_insert`, `reports_after_insert_apply_effects`, `reports_on_status_change`, `reports_emit_admin_system_message`.
- Helpers: `is_admin(uid)`, `inject_system_message`, `find_or_create_support_chat`, `is_post_visible_to`, `is_chat_visible_to`.
- RPC: `admin_remove_post(post_id)` (FR-ADMIN-009).

**Application/Infrastructure:**
- `ReportPostUseCase`, `ReportChatUseCase`, `IReportRepository`, `SupabaseReportRepository`.

**UI:**
- `ReportPostModal`, `ReportChatModal`, `useIsSuperAdmin`.
- `app/settings/report-issue.tsx` (FR-MOD-002).

**Domain (`packages/domain/src/value-objects.ts`):**
- `account_status` enum already includes `suspended_admin` and `suspended_for_false_reports`.

## 4. Architecture (per `CLAUDE.md` §5)

- DB triggers + RPCs are the source of truth for state transitions; application layer orchestrates and maps errors.
- All admin RPCs: `SECURITY DEFINER` + `SET search_path = public` + `is_admin(auth.uid())` guard inside body + `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO authenticated`.
- Sanction escalation lives in a DB trigger (atomic, unbypassable from client).
- Sign-in gate is an RPC the client calls right after successful auth, separately portable from admin operations.

## 5. Database — migration `0034_moderation_admin_actions.sql`

### 5.1 Schema additions

```sql
alter table public.reports
  add column if not exists sanction_consumed_at timestamptz;
-- Marks a dismissed report as already accounted for in a sanction.
-- Excluded from the rolling-30d window count (replaces the discarded
-- "rewrite resolved_at backwards" approach).

alter table public.audit_events
  drop constraint audit_events_action_check,
  add  constraint audit_events_action_check check (action in (
    'block_user','unblock_user',
    'report_target',
    'auto_remove_target','manual_remove_target','restore_target',
    'suspend_user','unsuspend_user',
    'ban_user',                    -- NEW: distinct from suspend_user
    'false_report_sanction_applied',
    'dismiss_report','confirm_report',
    'delete_message'               -- NEW: chat-message hard-delete
  ));
```

`User.false_reports_count` is no longer maintained by triggers (per FR-MOD-010 v0.3 AC1). Migration 0034 drops the increment from the existing `reports_on_status_change` body if present; the column itself is retained as a denormalised informational counter that future tooling may set.

### 5.2 Admin action RPCs

| RPC | Behaviour | Audit action |
|---|---|---|
| `admin_restore_target(p_target_type text, p_target_id uuid)` | Reverses auto-removal: post → `open` (only if currently `removed_admin`); user → `active` (**only if currently `suspended_admin`** — banned/suspended_for_false_reports/deleted are rejected with `invalid_restore_state`); chat → `removed_at = null`. Stamps **all open reports** on the target as `dismissed_no_violation` in a single statement. Idempotent — re-running on already-restored target is a quiet no-op (no extra audit row). | `restore_target` |
| `admin_dismiss_report(p_report_id uuid)` | Stamps a single report as `dismissed_no_violation`. Recomputes `count(distinct reporter_id) where target = ... and status = 'open'` after stamp; if count drops below 3 AND the target is currently in its auto-removal terminal state, restore the target (post → `open`, user → `active` if `suspended_admin`, chat → `removed_at = null`). | `dismiss_report` (+ `restore_target` if cascading restore fired) |
| `admin_confirm_report(p_report_id uuid)` | Stamps report as `confirmed_violation`. Auto-removal stands. | `confirm_report` |
| `admin_ban_user(p_target_user_id uuid, p_reason text, p_note text)` | `account_status = 'banned'`. Idempotent (`UPDATE ... WHERE account_status <> 'banned'; IF NOT FOUND THEN RETURN; END IF;` — no audit on no-op). Rejects self-ban. | `ban_user` (metadata: `{reason, note}`) |
| `admin_delete_message(p_message_id uuid)` | Hard-deletes a single `messages` row. Refuses `kind = 'system'` (system messages are immutable for audit). | `delete_message` (metadata: `{chat_id}`) |
| `admin_audit_lookup(p_user_id uuid, p_limit int default 200)` | Returns up to `least(p_limit, 1000)` audit rows where `actor_id = p_user_id` OR `target_id = p_user_id`. For `action = 'report_target'` rows where `target_id = p_user_id`, the `metadata.reporter_id` field is NOT redacted (admins intentionally pivot from target → reporter). | (read; no audit) |
| `auth_check_account_gate(p_user_id uuid)` | Returns `{ allowed bool, reason text, until timestamptz }`. **Eligible for lazy unsuspend ONLY** when current `account_status = 'suspended_for_false_reports'` AND `account_status_until <= now()`. In that case, sets status back to `active` and writes audit `unsuspend_user` with `actor_id = NULL` and `metadata.lazy = true`. The audit row is written only `IF FOUND` after a conditional `UPDATE` (prevents duplicate rows on multi-device sign-in). All other suspended/banned/deleted statuses are surfaced as-is. | `unsuspend_user` (only on lazy unsuspend; `actor_id = NULL`) |

All RPCs except `auth_check_account_gate` require `is_admin(auth.uid())`. The gate RPC requires `auth.uid() = p_user_id` (a user can only check themselves) — but since the function only ever sets `active` for the narrow lazy-unsuspend case above, self-call cannot lift a `banned` or `suspended_admin` row.

All RPCs end with `REVOKE EXECUTE … FROM PUBLIC; GRANT EXECUTE … TO authenticated;`.

### 5.3 False-report sanction trigger

`reports_after_status_change_apply_sanctions` — `AFTER UPDATE OF status ON reports REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT`:

```text
for each reporter_id appearing in new_rows where new.status = 'dismissed_no_violation':
  -- serialize per reporter
  perform pg_advisory_xact_lock(hashtextextended('mod_sanction', reporter_id::text))
  -- or: SELECT * FROM users WHERE user_id = reporter_id FOR UPDATE

  v_count := count(reports
                   where reporter_id = X
                     and status = 'dismissed_no_violation'
                     and resolved_at > now() - interval '30 days'
                     and sanction_consumed_at is null)

  if v_count >= 5:
    v_existing_level := users.false_report_sanction_count where user_id = X
    v_new_level := least(v_existing_level + 1, 3)

    update users set
      false_report_sanction_count = v_new_level,
      account_status = 'suspended_for_false_reports',
      account_status_until = case
        when v_new_level = 1 then now() + interval '7 days'
        when v_new_level = 2 then now() + interval '30 days'
        else null  -- permanent
      end
    where user_id = X
      and false_report_sanction_count = v_existing_level  -- guard against double-step

    update reports set sanction_consumed_at = now()
    where reporter_id = X
      and status = 'dismissed_no_violation'
      and resolved_at > now() - interval '30 days'
      and sanction_consumed_at is null

    audit('false_report_sanction_applied', actor=null, target=user, metadata={level=v_new_level, until})
    audit('suspend_user',                  actor=null, target=user, metadata={reason='false_reports', level=v_new_level})
```

Statement-level firing + advisory lock + level guard makes a single restore that stamps N reports increment the sanction by **at most one level**, regardless of how many rows belong to the same reporter (resolves council critical #1). `sanction_consumed_at` preserves audit truth (resolves council critical #4). `FOR UPDATE` / advisory lock serialises concurrent admin actions (resolves council important #8).

### 5.4 System-message kinds

Used in `messages.system_payload->>'kind'`:
- `report_received` — already emitted by `reports_emit_admin_system_message` trigger. Admin sees in their support thread with reporter.
- `auto_removed` — emitted by `reports_after_insert_apply_effects` when threshold hit. Goes into the same admin↔reporter thread.
- `mod_action_taken` — written by admin RPCs (via `inject_system_message`) after success. Admin-side handled marker. UI dims the prior `report_received` / `auto_removed` bubble that references the same `report_id`/`target_id`.
- `owner_auto_removed` — **NEW** — emitted by §5.5 trigger to the **owner's** support thread when their post/account/chat is auto-removed. Distinct kind so UI rendering does not collide with the admin-side handled marker.

### 5.5 Owner notification trigger

The existing `reports_after_insert_apply_effects` trigger already has a `BEGIN ... EXCEPTION WHEN OTHERS THEN NULL END` block for the admin-side system message. Migration 0034 appends a **second**, independently wrapped block for owner notification, executed only when the local `distinct_reporters >= 3` flag fired in this invocation (capture into a local `v_threshold_hit boolean` early in the function):

```text
-- after the existing admin-side message block
if v_threshold_hit then
  begin
    -- target_type-specific owner lookup
    v_owner_id := case new.target_type
      when 'post' then (select owner_id from posts where post_id = new.target_id)
      when 'user' then new.target_id  -- the suspended user is the owner
      when 'chat' then null           -- both parties; skip for MVP, deferred
    end;
    if v_owner_id is not null then
      v_owner_chat := find_or_create_support_chat(v_owner_id);
      if v_owner_chat is not null then
        perform inject_system_message(v_owner_chat,
          jsonb_build_object('kind', 'owner_auto_removed',
                             'target_type', new.target_type,
                             'target_id', new.target_id),
          null);
      end if;
    end if;
  exception when others then null;
  end;
end if;
```

Independent `EXCEPTION` block ensures owner-side failure can never abort the report INSERT (resolves council important #5).

## 6. Application layer

### 6.1 Ports

`packages/application/src/ports/IModerationAdminRepository.ts`:

```ts
interface IModerationAdminRepository {
  restoreTarget(targetType: 'post'|'user'|'chat', targetId: string): Promise<void>
  dismissReport(reportId: string): Promise<void>
  confirmReport(reportId: string): Promise<void>
  banUser(userId: string, reason: 'spam'|'harassment'|'policy_violation'|'other', note: string): Promise<void>
  deleteMessage(messageId: string): Promise<void>
  auditLookup(userId: string, limit?: number): Promise<AuditEvent[]>
}
```

`packages/application/src/ports/IAccountGateRepository.ts` — **separate file, separate port** (different auth model — user-self vs admin):

```ts
interface IAccountGateRepository {
  checkAccountGate(userId: string): Promise<{
    allowed: boolean
    reason?: 'banned' | 'suspended_admin' | 'suspended_for_false_reports'
    until?: string
  }>
}
```

`IReportRepository` (existing) — `submit({target_type:'user', ...})` already supported by DB; no port change needed.

### 6.2 Use cases

`packages/application/src/moderation/`:
- `RestoreTargetUseCase.ts`
- `DismissReportUseCase.ts`
- `ConfirmReportUseCase.ts`
- `BanUserUseCase.ts` — pre-checks `userId !== currentUserId` (defence-in-depth; DB also rejects).
- `DeleteMessageUseCase.ts`
- `LookupAuditUseCase.ts`
- `CheckAccountGateUseCase.ts`
- `ReportUserUseCase.ts` — wraps `IReportRepository.submit` with `target_type='user'`.

`packages/application/src/moderation/errors.ts`:
- `ModerationForbiddenError` — non-admin attempted admin action.
- `AccountSuspendedError(until: Date)` — sign-in gate rejection (false-report timed).
- `AccountAdminSuspendedError` — sign-in gate rejection (admin manual, indefinite).
- `AccountBannedError` — sign-in gate rejection (permanent).
- `InvalidRestoreStateError` — `admin_restore_target` rejected (e.g., user is `banned`).

### 6.3 Domain layer

`AuditEvent` value object: confirm presence in `packages/domain/src/entities.ts`; if missing, add `{ event_id, actor_id?, action, target_type?, target_id?, metadata, created_at }`.

No other domain changes — `account_status` enum already includes both `suspended_admin` and `suspended_for_false_reports` (verified at `packages/domain/src/value-objects.ts:21`).

## 7. Infrastructure

Two adapter files (resolves council important #9):
- `infrastructure-supabase/src/moderation/SupabaseModerationAdminRepository.ts` — implements `IModerationAdminRepository` against admin RPCs. Maps Postgres error code `42501` → `ModerationForbiddenError`, custom `invalid_restore_state` → `InvalidRestoreStateError`.
- `infrastructure-supabase/src/auth/SupabaseAccountGateRepository.ts` — implements `IAccountGateRepository`. Lives in `auth/` directory because it's part of the auth flow, not admin moderation.

The auth composition root must also expose a `signOut()` method through an `IAuthService` port (if not already) so that the sign-in gate handler does not call `supabase.auth.signOut()` directly from the layout. If `IAuthService` does not exist, use the existing pattern in `auth/` adapters.

## 8. UI

### 8.1 SystemMessageBubble (`apps/mobile/src/components/chat/system/`)

To respect the 200-line cap (resolves council important #10), split into per-kind subcomponents from the start:

```
src/components/chat/system/
├── SystemMessageBubble.tsx          // dispatcher: reads payload.kind, renders subcomponent
├── ReportReceivedBubble.tsx         // kind='report_received'
├── AutoRemovedBubble.tsx            // kind='auto_removed'
├── ModActionTakenBubble.tsx         // kind='mod_action_taken' — dimmed, no actions
├── OwnerAutoRemovedBubble.tsx       // kind='owner_auto_removed' — owner-side, no actions
└── adminActions.ts                  // shared: confirmation Alert helpers + handler bindings
```

Each subcomponent reads `useIsSuperAdmin()` and renders action buttons accordingly. After action success, the parent message list is invalidated (or local state flipped) and the bubble dims.

Confirmation modal text examples (Hebrew, all into `i18n/he.ts`):
- Restore: "פעולה זו תסמן את 3 הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?"
- Dismiss single: "סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?"
- Confirm: "אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?"
- Ban: "פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?"

### 8.2 ReportUserModal (`apps/mobile/src/components/profile/ReportUserModal.tsx`)

Mirrors `ReportPostModal`: reason picker (`Spam`/`Offensive`/`Misleading`/`Illegal`/`Other`) + ≤500-char optional note → `ReportUserUseCase`. Trigger from `⋮` on `app/profile/[id].tsx` (any non-self profile).

### 8.3 BanUserModal (`apps/mobile/src/components/profile/BanUserModal.tsx`)

Admin-only entry from `⋮` on `app/profile/[id].tsx`. Reason radio + free text → confirmation modal → `BanUserUseCase`.

### 8.4 Chat-thread admin actions (FR-ADMIN-005)

Two distinct paths:
1. **Linked-post deletion** — when a system bubble references a post (`payload.target_type === 'post'`), `AutoRemovedBubble` includes a `🗑 הסר פוסט` button → existing `admin_remove_post` RPC.
2. **Chat-message hard-delete** — admin viewing any chat sees a `🗑 מחק כאדמין` overflow item on user-kind message bubbles (not system bubbles). Confirmation → `DeleteMessageUseCase` → row hard-deleted.

### 8.5 Audit page (`apps/mobile/app/settings/audit.tsx`)

- Hidden from Settings list when `!isSuperAdmin`.
- Search by `display_name` (existing search RPC) → returns user IDs.
- `LookupAuditUseCase` → renders read-only list of last 200 events: `{action} · {target_type}#{short_id} · {time}`. Tapping a row expands `metadata` JSON pretty-printed.

### 8.6 Sign-in gate

In the post-auth navigation handler (composition root, not the layout file), after every successful sign-in:

```ts
const gate = await checkAccountGateUseCase.execute(user.id)
if (!gate.allowed) {
  await authService.signOut()  // via IAuthService port, not direct supabase call
  router.replace({
    pathname: '/account-blocked',
    params: { reason: gate.reason, until: gate.until }
  })
}
```

`apps/mobile/app/account-blocked.tsx` must live **outside** the `(auth)` group so it's reachable when signed out. Confirm via expo-router types — if expo-router's typed routes complain, add a leaf route in the unauthenticated stack.

| `reason` | Heading | Body | CTA |
|---|---|---|---|
| `banned` | "החשבון נחסם לצמיתות" | "החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה." | `mailto:karmacommunity2.0@gmail.com` ("יצירת קשר") |
| `suspended_admin` | "החשבון הושעה" | "המוֹדֶרציָה השעתה את החשבון שלך עד לבירור." | `mailto:karmacommunity2.0@gmail.com` ("ערעור") |
| `suspended_for_false_reports` | "החשבון מושעה זמנית" | "החשבון שלך מושעה עד {until_local} עקב 5 דיווחים שגויים ב-30 הימים האחרונים." | `mailto:karmacommunity2.0@gmail.com` ("ערעור מוקדם") |

**No automated outbound email** — `mailto:` only.

### 8.7 Reporter feedback after admin Restore

Per **FR-MOD-005 AC4** (anti-feedback for spam-reporters), the reporter receives **no notification** of admin restore decisions. This is intentional and consistent with existing spec. Documented here so it's not mistaken for a gap.

### 8.8 i18n inventory (`apps/mobile/src/i18n/he.ts`)

All new keys under `moderation.*` and `audit.*`. Inventory:

- `moderation.report.user.title`, `moderation.report.user.reasonLabel`, `moderation.report.user.noteLabel`, `moderation.report.user.submit`, `moderation.report.user.successToast`, `moderation.report.user.duplicateError`
- `moderation.report.reasons.spam|offensive|misleading|illegal|other`
- `moderation.ban.title`, `moderation.ban.reasonLabel`, `moderation.ban.reasons.spam|harassment|policy_violation|other`, `moderation.ban.noteLabel`, `moderation.ban.submit`, `moderation.ban.confirmCopy`, `moderation.ban.successToast`
- `moderation.bubble.reportReceived.title`, `moderation.bubble.reportReceived.body` (with placeholders for target_type, reason, count)
- `moderation.bubble.autoRemoved.title`, `moderation.bubble.autoRemoved.body`
- `moderation.bubble.modActionTaken.body` (with placeholder for action+time)
- `moderation.bubble.ownerAutoRemoved.body` (owner-facing neutral language per FR-MOD-005 AC5)
- `moderation.actions.restore|dismiss|confirm|ban|removePost|deleteMessage`
- `moderation.actions.confirm.restore|dismiss|confirm|ban|removePost|deleteMessage` (modal copy)
- `moderation.actions.successToast.restore|dismiss|confirm|ban|removePost|deleteMessage`
- `moderation.actions.errors.forbidden|invalidRestoreState|networkError`
- `accountBlocked.banned.title|body|cta`, `accountBlocked.suspendedAdmin.title|body|cta`, `accountBlocked.suspendedForFalseReports.title|body|cta` (with `{until}` placeholder)
- `audit.title`, `audit.searchPlaceholder`, `audit.noResults`, `audit.loading`, `audit.row.action.{action_name}` for each enum value, `audit.row.metadataLabel`

All strings Hebrew, RTL.

## 9. Tests

### 9.1 Unit (`vitest`, per package)

- Each use case: success path; idempotent re-run; permission rejection; specific error mapping (`ModerationForbiddenError`, `InvalidRestoreStateError`, `AccountBannedError`, etc.).
- `CheckAccountGateUseCase`: all 4 statuses; lazy unsuspend ONLY on `suspended_for_false_reports` with expired `until`; non-eligible statuses are surfaced as-is.
- `BanUserUseCase`: rejects self-ban without hitting DB.
- `DismissReportUseCase`: when count drops below 3 after dismiss, expects `restoreTarget` cascade (mocked via repo).

### 9.2 DB integration (SQL scripts under `supabase/tests/` if pattern exists, else documented manual SQL via Supabase Studio)

- **Sanction trigger does NOT double-fire**: insert 3 reports from same reporter on one post → admin restore → assert `users.false_report_sanction_count` increments by exactly 1 (not 3).
- **Sanction escalation E2E**: 5 dismissals in 30d → 7-day suspension; 5 more after return → 30-day; 5 more → permanent.
- **Window correctness via `sanction_consumed_at`**: after first sanction, `sanction_consumed_at` is set on the 5 rows; a 6th new dismissal does NOT trigger a second sanction until 5 fresh rows accumulate.
- **`auth_check_account_gate` self-call cannot lift `banned` or `suspended_admin`**: try as the user themselves — gate returns `allowed:false` and audit is unchanged.
- **`auth_check_account_gate` lazy unsuspend writes `actor_id = NULL`**.
- **`admin_restore_target('user', X)` rejects when X is `banned`**: assert `invalid_restore_state` raised.
- **`admin_delete_message` refuses `kind='system'`**.
- **Authorisation**: every `admin_*` RPC fails with `42501` for non-admin caller.
- **Owner notification**: insert 3 reports on a post → assert one `owner_auto_removed` system message in owner's support thread.

### 9.3 Manual browser verification (Chrome MCP, super-admin account)

- Submit a report from post detail → admin support thread shows `report_received` bubble.
- Click `↩ שחזר` → confirmation modal → post returns to feed; bubble dims to `mod_action_taken`.
- Sign in as suspended user → `account-blocked` screen renders correct copy and `mailto:` opens mail app.
- Open Settings as super admin → "אאודיט" item visible; search a user → list renders.
- Owner of an auto-removed post sees the `owner_auto_removed` bubble in their support thread.

## 10. SSOT updates (in the same PR as implementation)

- `BACKLOG.md`: P1.3 → ✅ Done; P2.2 → ✅ Done.
- `spec/08_moderation.md`: header → ✅ if FR-MOD-008 marked deferred-by-decision; otherwise stay 🟡 with note. (Already updated v0.3 for FR-MOD-010 AC1.)
- `spec/12_super_admin.md`: header → ✅.
- `TECH_DEBT.md`: add
  - **TD-NN (BE):** FR-MOD-008 suspect-queue producers — priority: medium.
  - **TD-NN (BE):** FR-ADMIN-003 AC3 — 90-day re-registration block — priority: low.
  - **TD-NN (BE):** Cron-based suspension expiry (currently lazy at sign-in) — priority: low.
  - **TD-NN (FE):** Owner moderation push notification when P1.5 lands (currently in-app system message only) — priority: low.

## 11. Risks (post-mitigation)

- **Restore mass-stamps reporters** — mitigated by statement-level trigger + advisory lock + level guard (§5.3).
- **Sign-in gate latency** — extra RPC per auth; acceptable for MVP, monitor.
- **Audit RPC data exposure** — gated by `is_admin()` in body + `REVOKE FROM PUBLIC`; verified by test.
- **Owner notification trigger swallowing failures silently** — by design (best-effort, per pattern in 0005); admin-side path already does the same.

## 12. Definition of Done

- All ACs in FR-MOD-007, FR-MOD-010 v0.3, FR-ADMIN-002, FR-ADMIN-003 (excluding AC3), FR-ADMIN-004, FR-ADMIN-005, FR-ADMIN-007 satisfied.
- DB migration green on local.
- Unit tests pass; lint + typecheck green; `pnpm lint:arch` green.
- Manual browser verification recorded in PR description.
- SSOT files updated in same PR.
