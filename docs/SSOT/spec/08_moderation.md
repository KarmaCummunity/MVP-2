# 2.8 Reports & Moderation

> **Status:** 🟡 Partial — Reports + auto-removal shipped. Block/unblock deferred (EXEC-9).



Prefix: `FR-MOD-*`

---

## Scope

The user-facing safety mechanisms:

- Reporting a post, profile, comment, or chat conversation.
- Reporting a general issue from Settings (support thread to Super Admin).
- Auto-removal after 3 reports on the same target.
- False-report sanctions (graduated suspensions).
- Suspect-flag pipeline that surfaces problematic content for admin review.

> **Out of MVP scope (per `EXEC-9`, 2026-05-11).** Per-user blocking / unblocking and bilateral block-based visibility filtering are deferred post-MVP. The specs for `FR-MOD-003`, `FR-MOD-004`, and `FR-MOD-009` below are retained for reference and carry a `DEPRECATED — post-MVP` banner.

The Super Admin's actions on reports (restore, manual ban, manual delete) are documented in [`12_super_admin.md`](./12_super_admin.md).

---

## FR-MOD-001 — Report a content target

**Description.**
A user reports a post, another user, a comment (none in MVP UI but reserved), or a chat thread for moderator review.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `04_User_Flows.md` Flow 9.A, `05_Screen_UI_Mapping.md` §6.1.
- Constraints: `R-MVP-Privacy-4`, `R-MVP-Privacy-5`.

**Acceptance Criteria.**
- AC1. The Report modal is reachable from `⋮` menus on a post (Post Detail, feed card not in MVP), a profile, and a chat (`FR-CHAT-010`).
- AC2. Reason picker (single select, required): `Spam`, `Offensive content`, `Misleading`, `Illegal`, `Other`. An optional free-text field of up to 500 characters complements the reason.
- AC3. On submission, a `Report { reporter, target_type, target_id, reason, note, created_at }` is created.
- AC4. A system message is appended to the Super Admin's inbox (`FR-ADMIN-001`) with a link to the target and the reason.
- AC5. The target post / profile is **immediately hidden** from the reporter (client-side) regardless of whether the auto-removal threshold is reached.
- AC6. The reporter receives a confirmation toast: *"✅ Report received. Our team will review."*
- AC7. Duplicate reports from the same reporter on the same target within 24 hours are rejected with `DUPLICATE_REPORT` (idempotency).

**Related.** Screens: 6.1 · Domain: `Report`.

---

## FR-MOD-002 — Report a general issue from Settings

**Description.**
A user files a support / bug / feedback report from Settings, which becomes a chat thread with the Super Admin.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `04_User_Flows.md` Flow 9.B, `05_Screen_UI_Mapping.md` §6.1b.
- Constraints: `R-MVP-Privacy-4a`.

**Acceptance Criteria.**
- AC1. The Report Issue modal collects a description (required, ≥10 chars) and an optional category (`Bug`, `Account`, `Suggestion`, `Other`).
- AC2. Submission triggers `FR-CHAT-007` (open or resume the support thread) and injects a system message containing the category and description verbatim.
- AC3. The system message contains a stable internal ID that lets the Super Admin reference the thread when replying or escalating.
- AC4. The user is dropped onto the conversation screen after submission.
- AC5. **No** auto-removal counter increments for this kind of report (it has no content target — `R-MVP-Privacy-4a`).

**Related.** Screens: 6.1b · Domain: `Report` (with `target_type = none`).

---

## FR-MOD-003 — Block a user — **DEPRECATED (post-MVP)**

**Status.** ⚠️ Out of MVP scope per `EXEC-9` (2026-05-11). No UI, use case, port, or adapter ships in MVP. The DB schema (`public.blocks` table, `is_blocked()` / `has_blocked()` predicates) remains in migrations `0003`/`0004`/`0005` but stays unpopulated. Restored when post-MVP block work is greenlit.

**Description.**
A user blocks another user.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `04_User_Flows.md` Flow 9.C.
- Constraints: `R-MVP-Privacy-3`.

**Acceptance Criteria.**
- AC1. Reachable from any `⋮` menu that lists "Block User": Post Detail, Other Profile, Conversation.
- AC2. Confirmation modal explains: *"You will not see [name]'s posts and they will not be able to message you. They will not be told."*
- AC3. On confirm, a `Block { blocker, blocked, created_at }` row is created.
- AC4. Side effects (idempotent on duplicate blocks):
   - Existing `FollowEdge` in either direction is removed.
   - Pending `FollowRequest`s in either direction are dropped.
   - `Chat`s involving both users are filtered from my Inbox.
   - The blocked user's posts are filtered from my feed.
   - My posts are filtered from the blocked user's feed.
- AC5. The blocked user is never notified.

**Related.** Screens: 6.2 · Domain: `Block`, `FollowEdge`, `FollowRequest`, `Chat`.

---

## FR-MOD-004 — Unblock a user — **DEPRECATED (post-MVP)**

**Status.** ⚠️ Out of MVP scope per `EXEC-9` (2026-05-11). `D-11` (Unblock restores visibility) is superseded.

**Description.**
A user removes a block via the Blocked Users screen.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `05_Screen_UI_Mapping.md` §5.3.
- Decisions: `D-11` (superseded by `EXEC-9`).

**Acceptance Criteria.**
- AC1. The Blocked Users screen lists every active `Block` with avatar, name, and an "Unblock" button.
- AC2. On unblock, the `Block` row is hard-deleted; cached projections (feed, inbox) refresh within `NFR-PERF-005`.
- AC3. After unblock, B's older posts become visible to A again (`D-11`).
- AC4. Follow edges are **not** restored automatically; A must follow again if desired.
- AC5. Re-blocking immediately is allowed and behaves as `FR-MOD-003` from a fresh state.

**Related.** Screens: 5.3 · Domain: `Block`.

---

## FR-MOD-005 — Auto-removal at 3 reports

**Description.**
When a content target accumulates 3 distinct reports from 3 distinct reporters, it is auto-removed.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `04_User_Flows.md` Flow 9.A.
- Constraints: `R-MVP-Privacy-5`.

**Acceptance Criteria.**
- AC1. The auto-removal threshold counts only `Report` rows with distinct `reporter_id` values; multiple reports from the same user on the same target count as one for this rule.
- AC2. On threshold breach (transactionally with the 3rd qualifying report):
   - For `target_type = post`: status moves to `removed_admin`.
   - For `target_type = user`: account moves to `suspended_admin` and is signed out on next refresh.
   - For `target_type = chat`: the chat is hidden from both users with a moderation banner.
- AC3. A system message is appended to the Super Admin's thread (`FR-ADMIN-002`) with the message: *"Auto-removed after 3 reports. [target link]. Want to restore?"* with a quick action "↩ Restore".
- AC4. The reporters receive **no** notification confirming removal (anti-feedback for spam-reporters).
- AC5. The owner of the removed target receives a notification (`FR-NOTIF-011`) — Critical category — explaining the removal in neutral language.

**Related.** Domain: `Report`, `Post.status`, `User.account_status`, `Chat.hidden`.

---

## FR-MOD-006 — Manual moderation actions (delegated)

**Description.**
The Super Admin may manually remove a target or restore a previously auto-removed one.

**Source.**
- PRD: `02_Personas_Roles.md` §2.2 (Super Admin).

**Acceptance Criteria.**
- AC1. Manual actions are delegated to [`12_super_admin.md`](./12_super_admin.md) (`FR-ADMIN-002` and onwards).
- AC2. Every manual action emits an `audit_event` (`R-MVP-Safety-3`).

---

## FR-MOD-007 — Report a user from a profile

**Description.**
The "Report" entry in the profile `⋮` menu opens the Report modal with `target_type = user`.

**Source.**
- PRD: `04_User_Flows.md` Flow 9.A.

**Acceptance Criteria.**
- AC1. Same modal as `FR-MOD-001`.
- AC2. Reporting a user does not perform any other action; submission is a no-op outside the report row + auto-removal counter (`FR-MOD-005`). (`EXEC-9` removed the "must explicitly tap Block" follow-up from MVP scope.)

---

## FR-MOD-008 — Suspect queue

**Description.**
A virtual queue surfaces posts that need attention before reaching the auto-removal threshold (e.g., excessive reopens, advisory keyword hit).

**Source.**
- Constraints: `R-MVP-Items-7`, `R-MVP-Items-9`, `R-MVP-Items-10`.

**Acceptance Criteria.**
- AC1. A post enters the queue with reason `excessive_reopens` (when `Post.reopen_count >= 5`), `forbidden_keyword`, or `manual_flag`.
- AC2. The queue is exposed to the Super Admin only as system messages in their thread (no dedicated screen in MVP).
- AC3. Each queue entry includes a "↩ Restore / 🗑 Remove" inline action.

**Related.** Domain: `ModerationQueueEntry`.

---

## FR-MOD-009 — Mutual filtering of blocked users — **DEPRECATED (post-MVP)**

**Status.** ⚠️ Out of MVP scope per `EXEC-9` (2026-05-11). The DB-level `is_blocked()` / `has_blocked()` predicates remain in place but always return `false` because no UI populates `public.blocks`; visibility filters that reference them stay correct (no rows ⇒ no exclusions).

**Description.**
The system enforces full bilateral invisibility between blocked pairs across all surfaces.

**Source.**
- Constraints: `R-MVP-Privacy-3`.

**Acceptance Criteria.**
- AC1. Feeds, profile pages, search results, recipient pickers, follower lists, follow-request lists, and chats all filter out blocked-pair counterparts.
- AC2. The filter is applied at the data layer (RLS) so that any client implementation is automatically compliant (`NFR-SEC-002`).
- AC3. Mutual exclusion is bilateral: if A blocks B, the rule applies in both directions for all the surfaces above.

**Related.** Domain: `Block`.

---

## FR-MOD-010 — False-report sanctions (graduated)

**Description.**
A user who issues many reports that the Super Admin reviews and rejects ("not a violation") is sanctioned with escalating suspensions.

**Source.**
- Constraints: `R-MVP-Privacy-10`.
- Decisions: `D-13`.

**Acceptance Criteria.**
- AC1. Each `Report` that the Super Admin marks as `dismissed_no_violation` increments `User.false_reports_count`.
- AC2. Sanctions trigger when 5 dismissed reports accumulate within a 30-day window:
   - **First trigger**: 7-day suspension.
   - **Second trigger** (after the user returns and accumulates 5 more): 30-day suspension.
   - **Third trigger**: permanent suspension.
- AC3. Suspensions set `User.account_status = suspended_for_false_reports` and prevent sign-in until the timer elapses (or forever in the third case).
- AC4. A signed-out user under suspension sees a clear screen at sign-in attempt: *"Your account is suspended until [date] due to repeated false reports. You may file an appeal via support."*
- AC5. Audit events are recorded for every sanction transition.

**Related.** Domain: `User`, `Report`.

---

## FR-MOD-011 — Hidden-target visibility for the reporter

**Description.**
After reporting, the target is removed from the reporter's view regardless of system-wide moderation outcome.

**Source.**
- PRD: `04_User_Flows.md` Flow 9.A.

**Acceptance Criteria.**
- AC1. A `ReporterHide` row associates the reporter with the target; visibility queries exclude hidden targets for that reporter.
- AC2. The hide is permanent unless the reporter explicitly removes it (no UI in MVP for un-hiding; this exists for V2 as a "Hidden by me" list).
- AC3. Hidden targets do not appear in feeds, search results, recipient pickers, or chat anchors.

**Related.** Domain: `ReporterHide`.

---

## FR-MOD-012 — Audit logging of moderation actions

**Description.**
Every moderation-relevant event is recorded.

**Source.**
- Constraints: `R-MVP-Safety-3`.

**Acceptance Criteria.**
- AC1. Audited operations include: `report_target`, `auto_remove_target`, `manual_remove_target`, `restore_target`, `suspend_user`, `unsuspend_user`, `false_report_sanction_applied`. (`block_user` / `unblock_user` are reserved values in the audit schema for post-MVP block restoration — see `EXEC-9`.)
- AC2. The audit log has columns `actor_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `created_at`.
- AC3. Logs are append-only (no updates/deletes) and retained for 24 months.

**Related.** Domain: `AuditEvent`.

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.5, Flow 9, and Decisions D-11, D-13. |
| 0.2 | 2026-05-11 | `EXEC-9` — `FR-MOD-003`, `FR-MOD-004`, `FR-MOD-009` marked `DEPRECATED — post-MVP`. `FR-MOD-007 AC2` no longer references "Block". `FR-MOD-012 AC1` audit list drops `block_user` / `unblock_user` from MVP-required emitters. |
