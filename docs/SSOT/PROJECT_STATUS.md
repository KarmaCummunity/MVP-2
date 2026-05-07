# Project Status — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Document Status** | SSOT — actively maintained, **mandatory update** by every agent on every feature change |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-08 (P0.4-BE adapter + P0.3.c soft gate merged; audit hygiene — TD-41..43 captured + `CODE_AUDIT_2026-05-07.md` retired; P0.4-FE → In progress) |
| **Source of Truth (Requirements)** | [`SRS.md`](./SRS.md) → [`SRS/02_functional_requirements/`](./SRS/02_functional_requirements/) |
| **Source of Truth (Product)** | [`PRD_MVP_SSOT_/`](./PRD_MVP_SSOT_/00_Index.md) |
| **Architecture Rules** | User rules in `~/.cursor` + [`.cursor/rules/srs-architecture.mdc`](../../.cursor/rules/srs-architecture.mdc) |
| **Update Rules** | [`.cursor/rules/project-status-tracking.mdc`](../../.cursor/rules/project-status-tracking.mdc) |

---

## 0. Purpose

This document is the **single source of truth for project execution state**. It answers three questions for any agent (human or AI) before they start work:

1. **Where are we now?** (current sprint + in-flight work)
2. **What was already done?** (so we don't redo it)
3. **What is next, in priority order?** (so we always pick the highest-leverage task)

> **MANDATORY**: Every agent that adds, fixes, or modifies a feature MUST update this document in the same change-set. The Cursor rule [`project-status-tracking`](../../.cursor/rules/project-status-tracking.mdc) enforces this.

---

## 1. Snapshot — Current State (2026-05-08)

| Metric | Value |
| ------ | ----- |
| MVP completion (rough) | **~23%** (UI scaffolding + 2 auth paths + guest preview + onboarding slices A + C; DB schema applied; Posts repo adapter (BE) — FE wiring still mock-backed) |
| Features 🟢 done | 4 |
| Features 🟡 in progress | 2 (P0.3 — slice B remains; P0.4-FE — feed UI + create form) |
| Features 🔴 blocked | 0 |
| P0 critical features remaining | 3 (P0.3 slice B; P0.5 chat; P0.6 closure) — P0.4-FE in progress |
| Test coverage | use-case tests for `auth.*` (incl. Google + onboarding), feed selector |
| Open tech-debt items | 35 (1 partial) |

### What works end-to-end today

- Monorepo build (`pnpm typecheck` passes)
- **Native dev builds on iOS 26 + Android API-36 + Web** — all three platforms run correctly with Expo SDK 54 + expo-router 6
- All 27 MVP screens have UI scaffolding with mock data
- **Guest preview (peek feed)** — unauthenticated users open `(guest)/feed` with 3 public posts, join modal on card tap (`FR-AUTH-014`)

### What is fake / stubbed

- All non-auth screens still consume mock data (`apps/mobile/src/mock/data.ts`), including guest preview (`FR-AUTH-014`)
- **DB schema applied (0001–0008)** but application repositories not yet wired — all screens still use mock data (wired incrementally in P0.4–P0.6)
- No real CRUD for posts, follows, chats, reports, notifications, stats
- Apple / Phone-OTP sign-in routes still call email sign-in screen as a placeholder (Google SSO is real — see §4)
- Forgot-password flow not implemented
- Onboarding wizard photo step is a skip-only stub (full camera/gallery/resize/EXIF/Storage upload deferred to P0.3.b)

---

## 2. Priority Backlog

Priority bands are **strict**: P0 must finish before P1 starts in earnest.

### 🔥 P0 — Critical path (MVP cannot ship without these)

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P0.1 | Real email/password authentication + session lifecycle | FR-AUTH-006, 007, 013, 017 | 🟢 Done (2026-05-06) | See §4 entry |
| P0.2 | Database schema, RLS policies, migrations | (Cross-cutting — all FRs depend) | 🟢 Done (2026-05-07) | All migrations 0001–0008 applied. Repositories wired incrementally in P0.4–P0.6. |
| P0.3 | Onboarding wizard (basic info + photo + tour) wired to backend | FR-AUTH-010, 011, 012, 015 | 🟡 In progress | Slices A + C merged: Basic Info + Tour + soft gate live. Slice B (photo upload — camera/gallery + Storage) remains. |
| P0.4 | Post creation + feed (real CRUD, RLS-aware) | FR-POST-001…010, FR-FEED-001…005 | ⏳ Planned | Largest single chunk |
| P0.5 | Direct chat with realtime | FR-CHAT-001…008 | ⏳ Planned | Required for delivery coordination — the PMF loop |
| P0.6 | Closure flow (mark as delivered) | FR-CLOSURE-001…006 | ⏳ Planned | Required to capture the **North Star** metric (`closed_delivered` count) |

### 📈 P1 — High priority (PMF quality)

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P1.1 | Following + follow-requests (private profiles) | FR-FOLLOW-001…007 | ⏳ Planned | Needed for `FollowersOnly` post visibility |
| P1.2 | Search + filters + sort + cold-start fallback | FR-FEED-006…014 | ⏳ Planned | Drives discoverability |
| P1.3 | Reports + auto-removal + false-report sanctions | FR-MOD-001…008 | ⏳ Planned | Safety floor |
| P1.4 | Block / unblock + visibility restoration | FR-MOD-009, 010 | ⏳ Planned | |
| P1.5 | Push notifications (Critical + Social) | FR-NOTIF-001…006 | ⏳ Planned | |
| P1.6 | Personal & community stats | FR-STATS-001…004 | ⏳ Planned | |

### 📊 P2 — Polish

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P2.1 | Settings (notifications, privacy, blocked users) wired to backend | FR-SETTINGS-001…007 | ⏳ Planned | UI exists, no backend wiring |
| P2.2 | Account deletion + 30-day cooldown | FR-AUTH-016 | ⏳ Planned | |
| P2.3 | Forgot password (email) | FR-AUTH-008 | ⏳ Planned | Trivial once auth backend is up |
| P2.4 | Edit profile, privacy mode toggle | FR-PROFILE-001…007 | ⏳ Planned | |
| P2.5 | Super-admin in-chat moderation | FR-ADMIN-001…003 | ⏳ Planned | |

### 💎 P3 — Additional auth methods

| # | Feature | SRS IDs | Status | External setup needed |
| - | ------- | ------- | ------ | --------------------- |
| P3.1 | Google SSO sign-up / sign-in | FR-AUTH-003, FR-AUTH-007 | 🟢 Done (2026-05-07) | OAuth (PKCE) via Supabase + `expo-web-browser`; see §4 |
| P3.2 | Apple SSO sign-up / sign-in (iOS only) | FR-AUTH-004 | ⏳ Planned | Apple Developer account |
| P3.3 | Phone OTP | FR-AUTH-005 | ⏳ Planned | Twilio / Supabase phone provider config |
| P3.4 | Guest preview | FR-AUTH-014 | 🟢 Done (2026-05-07) | Dedicated `(guest)/feed`, join modal, `selectGuestPreviewPosts` in `@kc/application` |

### 🌐 P4 — Cross-platform parity

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P4.1 | Dedicated web app shell (or document `react-native-web` parity) | NFR-PLAT-* | ⏳ Planned | Currently single Expo app exports to web |

---

## 3. Sprint Board (current)

| Slot | Feature | Owner | Started | Target |
| ---- | ------- | ----- | ------- | ------ |
| Done | P0.2 — Database schema + RLS (all migrations 0001–0008 applied) | — | 2026-05-07 | 2026-05-07 |
| Done | P0.4-BE — Posts adapter (Supabase) | agent-be | 2026-05-08 | 2026-05-08 |
| In progress | P0.3 — Onboarding wizard (slices A + C merged; B = photo upload remains) | — | 2026-05-07 | — |
| In progress | P0.4-FE — Feed UI + Create form (consumes adapter, image upload, mock retirement) | agent-fe | 2026-05-08 | — |
| Up next | P0.5 — Direct chat with realtime | — | — | — |

---

## 4. Completed Features Log

Append-only. **Newest at top.** Git has the full file diff — see branch/commit. Operator verification steps are in [OPERATOR_RUNBOOK.md](./OPERATOR_RUNBOOK.md).

---

### 🟢 P0.4-BE — Posts repository adapter (Supabase)
- **SRS**: FR-POST-001..004, 008..011, 014; FR-FEED-001..005, 013
- **Branch**: `feat/FR-POST-001-be-posts-repo` · 2026-05-08
- **Tests**: tsc clean (all 5 packages); 25/25 vitest still green; no new tests (adapter mirrors `SupabaseAuthService` precedent — see TD-50)
- **Tech debt**: TD-13 partially resolved (close/reopen still stubbed for P0.6); adds TD-50 (no-tests for infra adapters)
- **Open gaps**: FR-CLOSURE-* close/reopen (P0.6) · image upload from device FR-POST-005 (P0.4-FE) · realtime feed FR-FEED-014 (P1.2) · `update()` does not change mediaAssets (image swap on edit deferred)

---

### 🟢 P0.3.c — FR-AUTH-015 soft gate before first meaningful action
- **SRS**: FR-AUTH-015 AC1 (modal mirrors basic-info form: display_name 1–50 + city + single "שמור והמשך" button), AC2 (Cancel = no side effects, returns to previous screen), AC3 (after save, deferred action proceeds)
- **Branch**: `feat/FR-AUTH-015-fe-soft-gate` · 2026-05-08
- **Files added**: `apps/mobile/src/components/OnboardingSoftGate.tsx` (provider + hook), `apps/mobile/src/components/OnboardingSoftGateModal.tsx`
- **Files changed**: `apps/mobile/app/_layout.tsx` (wraps Stack with SoftGateProvider inside AuthGate), `apps/mobile/app/(tabs)/create.tsx` (publish gated via `requestSoftGate(publish)`)
- **Tests**: 25/25 vitest · tsc clean (5 packages) · turbo lint = no-op (no lint task wired)
- **Tech debt**: None
- **Open gaps**: Other meaningful-action triggers in FR-AUTH-015 description (follow another user, send first chat message) wire later — `useSoftGate().requestSoftGate()` consumed by P1.1 follow buttons and P0.5 chat send when those land. Today only create-post publish is gated.

---

### 🟢 P0.3.a polish — Skip on every screen, dynamic cities, dev reset
- **SRS**: FR-AUTH-010 AC2+AC3, FR-AUTH-011 AC3, FR-AUTH-012 AC2
- **Branch**: `fix/onboarding-polish` · 2026-05-07
- **Tests**: 25/25 vitest · tsc clean (all 5 packages)
- **Tech debt**: Closes IL_CITIES oversight from slice A
- **Open gaps**: FR-AUTH-015 soft-gate (slice C) · photo full upload FR-AUTH-011 AC1+AC2 (slice B) · prod reset needs FR-AUTH-016 (P2.2)
- **Operator**: 0008 applied ✅

---

### 🟢 P0.3.a — Onboarding wizard (Basic Info + Tour, photo skip-stub)
- **SRS**: FR-AUTH-010 AC1+AC2+AC4, FR-AUTH-011 AC3+AC4+AC5, FR-AUTH-012 AC1–AC4, FR-AUTH-007 AC2
- **Branch**: `feat/FR-AUTH-010-onboarding-wizard` · 2026-05-07
- **Tests**: 25/25 vitest (6 new) · tsc clean (all 5 packages)
- **Tech debt**: TD-40 (SupabaseUserRepository stubs — fill in P0.4/P1.1/P1.4/P2.4)
- **Open gaps**: FR-AUTH-011 AC1+AC2 photo upload (slice B) · FR-AUTH-015 soft-gate (slice C) · FR-AUTH-010 AC3 explicit Skip affordance on basic-info

---

### 🟢 P0.2.f1 — Users Realtime publication
- **SRS**: FR-PROFILE-013 AC5, NFR-PERF-005
- **Branch**: `feat/p0-2-f1-users-realtime-and-td39` · 2026-05-07
- **Tech debt**: TD-39 (internal counter columns readable by non-owners of Public profiles — IUserRepository adapter MUST use `active_posts_count_for_viewer()`, never raw `_internal`)
- **Operator**: 0007 applied ✅

---

### 🟢 P0.2.f — Stats projections + counter triggers + community_stats
- **SRS**: FR-STATS-001..006, FR-PROFILE-013, FR-FEED-014+015, FR-CLOSURE-008 (data shape only), FR-PROFILE-001 AC2
- **Branch**: `feat/p0-2-f-stats-counters` · 2026-05-07
- **Tech debt**: Closes TD-21 · TD-20 open (activity timeline + nightly recompute job, P1.6)
- **Open gaps**: FR-STATS-003 activity timeline (app layer, P1.6) · FR-STATS-005 nightly `bg-job-stats-recompute` (P1.6) · FR-CLOSURE-008 Edge Function (P0.6) · `community_stats` is a view not MV (acceptable until scale)
- **Operator**: 0006 applied ✅

---

### 🟢 P0.2.e — Moderation schema
- **SRS**: FR-MOD-001+002+005+008+010+011+012, FR-CHAT-009+010
- **Branch**: `feat/p0-2-e-moderation-schema` · 2026-05-07
- **Tech debt**: TD-38 (sanction escalation 7d→30d→permanent is schema-only; escalation logic ships with FR-ADMIN-*)
- **Open gaps**: Notifications on auto-removal (FR-NOTIF, P1.5) · forbidden-keyword detection (future content-moderation service) · FR-ADMIN-002 restore action
- **Operator**: 0005 applied ✅

---

### 🟢 P0.2.d — Chat & Messaging schema
- **SRS**: FR-CHAT-001..007+009+011+012+013
- **Branch**: `feat/p0-2-d-chat-messaging` · 2026-05-07
- **Tech debt**: Adds `has_blocked` + `is_chat_visible_to` SECURITY DEFINER — same audit posture as P0.2.c
- **Open gaps**: Unread badge computed client-side (not denormalized) · FR-CHAT-013 AC3 90-day archive is post-MVP
- **Operator**: 0004 applied ✅

---

### 🟢 P0.2.c — Following & Blocking schema
- **SRS**: FR-FOLLOW-001..006+008+009+012, FR-MOD-003+004+009, FR-PROFILE-003
- **Branch**: `feat/p0-2-c-following-blocking` · 2026-05-07
- **Tech debt**: Closes P0.2.b `is_post_visible_to()` placeholder for FollowersOnly + block short-circuit
- **Open gaps**: Notifications on follow/request/approval (FR-NOTIF, P1.5) · `is_blocked` + `is_following` are SECURITY DEFINER — intentional (visibility predicates need to read both directions)
- **Operator**: 0003 applied ✅

---

### 🟢 P0.2.b — Posts core schema
- **SRS**: FR-POST-001..020, FR-FEED-001+002, FR-CLOSURE-002+003
- **Branch**: `feat/p0-2-db-schema-rls` · 2026-05-07
- **Tech debt**: TD-11 (storage bucket public-read — tighten to signed URLs at scale)
- **Open gaps**: `is_post_visible_to()` FollowersOnly placeholder → resolved P0.2.c ✅ · counter triggers → resolved P0.2.f ✅
- **Operator**: 0002 applied ✅

---

### ✅ P0.2.a — Foundation & Identity
- **SRS**: FR-AUTH-003+006+010..012+016(enum), FR-PROFILE-001..007+013
- **Branch**: `feat/p0-2-db-schema-rls` commit `1a04f0f` · 2026-05-07
- **Tech debt**: TD-1 ✅ resolved 2026-05-07
- **Open gaps**: Approved-follower expansion for Private profiles → P0.2.c ✅ · counter triggers → P0.2.f ✅
- **Operator**: 0001 applied ✅

---

### ✅ UX polish — Tab bar + Profile labels + Real Google identity on AuthSession
- **SRS**: FR-AUTH-003 AC5, FR-PROFILE-001 AC4+AC6, PRD §6.1.2
- **Branch**: `feat/p0-2-db-schema-rls` (alongside P0.2 prep) · 2026-05-07
- **Tests**: 19/19 vitest · tsc clean (application, infrastructure-supabase, mobile)
- **Tech debt**: TD-10 (`AuthSession.displayName`/`avatarUrl` are fallback-only once P0.4 wires real Profile reads)

---

### ✅ FR-AUTH-003 / FR-AUTH-007 — Google SSO sign-in & sign-up
- **SRS**: FR-AUTH-003, FR-AUTH-007, FR-AUTH-002 AC1
- **Branch**: (pre-commit · working tree) · 2026-05-07
- **Tests**: 19/19 vitest (3 new) · tsc clean
- **Open gaps**: Apple SSO (P3.2) · Phone OTP (P3.3) · native cold-start deep-link race (TD-3)

---

### ✅ FR-AUTH-014 (+ FR-AUTH-001 AC3) — Guest preview feed
- **SRS**: FR-AUTH-014, FR-AUTH-001 AC3
- **Branch**: (pre-commit · working tree) · 2026-05-07
- **Tests**: 16/16 vitest · tsc clean
- **Open gaps**: Community count copy is static string (not live FR-FEED-014 count — wire in P0.4)

---

### ✅ FR-AUTH-006 / 007 / 013 / 017 — Email/password auth + session lifecycle
- **SRS**: FR-AUTH-006+007+013+017
- **Branch**: (pre-commit · working tree) · 2026-05-06
- **Tests**: 13/13 vitest · application tsc clean
- **Tech debt**: TD-1, TD-2, TD-3
- **Open gaps**: Forgot-password (P2.3) · email-verification gating (P2.x) · breached-passwords HIBP (TD-2) · Google/Apple/Phone SSO still route to email screens (P3.1–P3.3)

---

## 5. Decisions Made During Execution

Mirror of [`SRS/appendices/C_decisions_log.md`](./SRS/appendices/C_decisions_log.md) entries that originated during MVP execution. Add new decisions here **and** in the SRS appendix.

| ID | Decision | Origin | Date |
| -- | -------- | ------ | ---- |
| EXEC-1 | Session storage on mobile uses `@react-native-async-storage/async-storage` (not `expo-secure-store`) per Supabase Expo guide; tokens are short-lived JWTs with rotating refresh tokens | P0.1 | 2026-05-06 |
| EXEC-2 | Auth use-cases live in `@kc/application/auth/*.ts` (one file per use case, ≤200 lines) — pure orchestration, all I/O via `IAuthService` port | P0.1 | 2026-05-06 |
| EXEC-3 | Vitest chosen as the unit-test runner for `@kc/domain` and `@kc/application` (lightweight, native ESM, fast) | P0.1 | 2026-05-06 |
| EXEC-4 | Adopted parallel-agents coordination protocol (lanes, draft-PR claim mechanism, `(contract)` scope rule, TD-N range split, tiebreakers). Spec at `docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md`; pointer in `CLAUDE.md`. | Two-agent setup | 2026-05-07 |

---

## 6. Tech Debt Log

Mirror / pointer to [`CODE_QUALITY.md`](./CODE_QUALITY.md) (which does not exist yet — see TD-4). Add `[PENDING REFACTOR]` entries here as discovered.

| ID | Item | Severity | Origin | Status |
| -- | ---- | -------- | ------ | ------ |
| TD-1 | `database.types.ts` is a stub (`type Database = any`) — must be regenerated from real schema once §P0.2 lands | High | P0.1 | ✅ Resolved 2026-05-07 (Audit found file is 325 LOC of real generated types — see `CODE_AUDIT_2026-05-07.md` AUDIT-P3-02) |
| TD-2 | FR-AUTH-006 AC1 requires breached-passwords check; not implemented (Supabase doesn't expose this OOTB; need HIBP API integration) | Med | P0.1 | Open |
| TD-3 | FR-AUTH-013 AC1 races with deep-links: cold-start session check happens before deep-link routing; needs `expo-router` redirect-with-state pattern | Med | P0.1 | Open |
| TD-4 | `docs/SSOT/CODE_QUALITY.md` is referenced from SRS.md but does not exist. Needs to be authored with: layer responsibilities, file-size cap policy, error mapping table, testing strategy, ADR template | High | Audit | Open |
| TD-5 | `apps/mobile/src/mock/data.ts` is consumed by ~5 screens; each must be migrated to real repositories during their respective P0 features | Med | Audit | Open |
| TD-6 | `packages/infrastructure-supabase/src/client.ts` has pre-existing TS errors: (a) `ConstructorParameters<typeof createClient>[2]` generic constraint mismatch with `@supabase/supabase-js@2.69`, (b) `process.env` references without `@types/node`. Fix during P0.2 (DB schema work) by tightening the storage adapter typing and adding `@types/node` as a dev dep on the infra package | Med | P0.1 verify | Open |
| TD-7 | `apps/mobile/app/(auth)/index.tsx` and `apps/mobile/app/(tabs)/create.tsx` used `'/(tabs)/'` (with trailing slash) which violated `expo-router` typed-routes mode | Low | Audit | ✅ Resolved 2026-05-06 (lint cleanup pass) |
| TD-8 | Mobile typecheck shows duplicate-identifier errors in `lib.dom.d.ts` (`URLSearchParams`, `RequestInfo`, `XMLHttpRequestResponseType`) due to React Native + DOM type collision. Cascades into false "Promise constructor not found" errors. Standard RN+TS pitfall; fix by adjusting `tsconfig.json` `lib` to drop `DOM` or by upgrading `@types/react-native` typings | Med | P0.1 verify | Open |
| TD-9 | `android/` is gitignored (CNG workflow). Must run `expo run:android` with `JAVA_HOME=.../temurin-17.jdk`. Pinned in `package.json android` script. If CI added, set `JAVA_HOME` env var there too. | Low | 2026-05-06 | Open |
| TD-10 | `AuthSession.displayName`/`avatarUrl` are an interim source for "My Profile" header (FR-AUTH-003 AC5). Once P0.2 lands and a real `Profile` table exists, the screen must read from `Profile` and these `AuthSession` fields become first-render fallback only. | Low | UX polish 2026-05-07 | Open |
| TD-11 | `post-images` storage bucket is public-read. For `OnlyMe`/`FollowersOnly` posts we rely on URL non-discoverability (the post row is hidden by RLS, so its image paths are not enumerable). Replace with per-object signed URLs (or a private bucket + sign-on-fetch) once we serve at scale or once anyone audits the privacy story. | Low | P0.2.b 2026-05-07 | Open |
| TD-12 | **Audit baseline 2026-05-07** — full review of code vs PRD/SRS produced 49 findings across P0/P1/P2/P3. All 49 findings are tracked as TD-13..TD-44 in this section + §2 backlog rows; final 3 gaps captured 2026-05-08 as TD-41..TD-43. Source file `CODE_AUDIT_2026-05-07.md` retired 2026-05-08 once every finding had a live owner. AUDIT-IDs cited in TD descriptions remain as historical provenance markers. | Low | Audit 2026-05-07 | ✅ Resolved 2026-05-08 |
| TD-13 | No `IPostRepository` Supabase adapter — port declared, no implementation. Mock data still consumed by feed/create/post detail. (AUDIT-P0-01) | High | Audit 2026-05-07 | 🟡 Partial — adapter ships in P0.4-BE 2026-05-08; close/reopen remain `not_implemented('P0.6')` until closure slice; FE wiring still mock-backed until P0.4-FE merges |
| TD-14 | No `IUserRepository` Supabase adapter; profile + user-detail screens use `MOCK_USER`. (AUDIT-P0-02) | High | Audit 2026-05-07 | Open (P0.4 / P2.4) |
| TD-15 | No `IChatRepository` Supabase adapter; chat list + thread use `MOCK_MESSAGES`. (AUDIT-P0-03) | High | Audit 2026-05-07 | Open (P0.5) |
| TD-16 | Chat schema (`chats`, `messages`, RLS, realtime triggers) not yet migrated — planned `P0.2.d`. (AUDIT-P0-04) | High | Audit 2026-05-07 | ✅ Resolved (P0.2.d applied) |
| TD-17 | Closure flow (mark delivered / un-mark / reopen / educational popup) entirely absent — North Star metric unmeasurable. (AUDIT-P0-05) | High | Audit 2026-05-07 | Open (P0.6) |
| TD-18 | Reports + block/unblock + auto-removal + false-report sanctions UI absent. (AUDIT-P0-06) | High | Audit 2026-05-07 | Open (P0.2.e + P1.3 + P1.4) |
| TD-19 | Push notifications: no device lifecycle, no fan-out, no preferences table. (AUDIT-P0-07) | High | Audit 2026-05-07 | Open (P1.5) |
| TD-20 | Statistics: counters render `0`; no `bg-job-stats-recompute`; no community-stats endpoint; no activity timeline. (AUDIT-P0-08) | High | Audit 2026-05-07 | Open (P1.6) |
| TD-21 | Counter triggers (`followers_count`, `following_count`, `active_posts_count_internal`, `items_given_count`, `items_received_count`) not written — planned `P0.2.f`; also missing `active_posts_count_public`. (AUDIT-P0-09 + AUDIT-X-04) | High | Audit 2026-05-07 | ✅ Resolved 2026-05-07 (P0.2.f — `0006_init_stats_counters.sql` adds all triggers; `active_posts_count_public` is split into `_public_open` + `_followers_only_open` per FR-PROFILE-013 AC2 viewer-dependence; viewer-aware total via `active_posts_count_for_viewer(owner, viewer)`. Nightly drift recompute (FR-STATS-005) tracked under TD-20 / P1.6.) |
| TD-22 | Onboarding wizard (Basic Info, Profile Photo, Welcome Tour, soft-gate on first action) skipped — users land on `(tabs)` immediately. (AUDIT-P0-10) | High | Audit 2026-05-07 | Open (P0.3) |
| TD-23 | Image upload in `(tabs)/create.tsx` is a no-op (no picker, no resize, no upload, no EXIF strip). Photo is mandatory for `Give`. (AUDIT-P0-11 + AUDIT-X-03) | High | Audit 2026-05-07 | Open (P0.4) |
| TD-24 | Apple SSO + Phone OTP buttons placeholder — required for iOS App Store + Israeli SMS path. (AUDIT-P0-12) | High | Audit 2026-05-07 | Open (P3.2 / P3.3) |
| TD-25 | No "Follow Requests" UI (screen 5.4); private profile not functional client-side. (AUDIT-P0-13) | High | Audit 2026-05-07 | Open (P1.1) |
| TD-26 | Free-text search, filter persistence, cold-start fallback, first-post nudge, community counter, realtime feed all absent. (AUDIT-P1-01..06) | High | Audit 2026-05-07 | Open (P1.2) |
| TD-27 | Auto-message in chat from post + read-receipt persistence absent. (AUDIT-P1-07, AUDIT-P1-08) | High | Audit 2026-05-07 | Open (P0.5) |
| TD-28 | Bio URL filter, Edit Profile screen, privacy toggle, upgrade-only enforcement on Edit Post all missing. (AUDIT-P1-12..14) | High | Audit 2026-05-07 | Open (P2.4) |
| TD-29 | 7 files exceed `≤ 200 LOC` hard cap (`create.tsx` 333, `(auth)/index.tsx` 266, etc.). See `CODE_AUDIT_2026-05-07.md` Appendix A. (AUDIT-P2-01) | High | Audit 2026-05-07 | Open |
| TD-30 | No JSDoc / TSDoc on most public exports across `domain`, `application`, `infrastructure`, mobile components. (AUDIT-P2-06) | Med | Audit 2026-05-07 | Open |
| TD-31 | Test coverage limited to 6 files; no tests for repos, components, infra adapters, or invariants. (AUDIT-P2-05) | Med | Audit 2026-05-07 | Open |
| TD-32 | `app/post/[id].tsx` falls back to `MOCK_POSTS[0]` on unknown ID — silent wrong-post display. Should render not-found. (AUDIT-P2-09) | Med | Audit 2026-05-07 | Open |
| TD-33 | No top-level `<ErrorBoundary>` in `app/_layout.tsx` — Supabase failures crash the app. (AUDIT-P2-10) | Med | Audit 2026-05-07 | ✅ Resolved 2026-05-08 (`apps/mobile/src/components/ErrorBoundary.tsx` wraps the root inside `SafeAreaProvider`; Hebrew fallback + retry; dev-only message detail) |
| TD-34 | `CLAUDE.md` references `PRD_MVP_SSOT_/` (does not exist; correct path: `PRD_MVP_CORE_SSOT/`). `SRS.md:10` references `../../PRD_MVP/` (correct: `./PRD_MVP_CORE_SSOT/`). (AUDIT-P3-03 + AUDIT-P3-04) | Low | Audit 2026-05-07 | ✅ Resolved 2026-05-07 (paths fixed in this commit) |
| TD-35 | `i18n/he.ts` (207 LOC) violates `≤ 200 LOC` cap; split per domain. (AUDIT-P3-08) | Low | Audit 2026-05-07 | Open |
| TD-36 | `SRS/appendices/A_traceability_matrix.md` referenced as FR ↔ R-MVP ↔ Screen ↔ Test mapping — needs population audit. (AUDIT-P3-06) | Low | Audit 2026-05-07 | Open |
| TD-37 | Sprint Board §3 lists "P0.2 In progress" without indicating P0.2.d/e/f are unwritten — needs a refresh. (AUDIT-P3-05) | Low | Audit 2026-05-07 | ✅ Resolved 2026-05-07 (sprint board updated; all migrations applied) |
| TD-38 | FR-MOD-010 sanction escalation (7d → 30d → permanent) is **schema only** in P0.2.e: `users.false_reports_count` increments via the report-status trigger, but the actual transition to `suspended_for_false_reports` and the stamping of `account_status_until` are **not** triggered by the DB. Reason: the rule is a 30-day sliding-window count of dismissed reports — the count, the window, and the tier escalation are admin-tooling decisions that should live with `FR-ADMIN-*` flow code (not in a generic trigger). Schema columns (`false_reports_count`, `false_report_sanction_count`, `account_status_until`) are reserved on `users` so the application can flip them when the admin slice lands. | Med | P0.2.e 2026-05-07 | Open |
| TD-39 | **Internal counter columns leak to non-owner viewers of Public profiles.** 0001's `users_select_public` policy + the row-level grant let any authenticated client read `active_posts_count_internal`, `items_given_count`, `items_received_count`, `posts_created_total`, `false_reports_count`, etc. on Public+active profiles. A non-owner can compute `internal − public_open − followers_only_open` to infer the existence of `OnlyMe` posts, violating FR-PROFILE-013 AC4's "**never** reveals" system-level guarantee, and FR-STATS-006 AC1's "stats screen never exposes data about other users" intent. Schema-level fix is awkward (Postgres column-grants apply per role *before* RLS, so revoking the grant from `authenticated` would also break the owner's own self-read). The correct fix is application-layer: the `IUserRepository` Supabase adapter (planned P2.4) MUST call `active_posts_count_for_viewer(owner, viewer)` for non-self reads and never project the raw `_internal` counter into Other-Profile responses. Add a lint/test to prevent regressions when the adapter is written. Schema-level reinforcement (a `users_public` view + revoke direct SELECT) is a possible future hardening but not blocking. | Med | P0.2.f1 audit 2026-05-07 | Open |
| TD-40 | `SupabaseUserRepository` is a P0.3.a slice stub — only `getOnboardingState`, `setBasicInfo`, `setOnboardingState` are wired against `public.users`. The remaining 19 `IUserRepository` methods throw `not_implemented` and must be filled in during P0.4 (`findByAuthIdentity`, `findById`), P1.1 (follows + follow-requests), P1.4 (blocks), P2.4 (`update`, `findByHandle`, `delete`). Adapter file: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`. The `not_implemented` errors include the slice that owns each method so callers know where to look. | Med | P0.3.a 2026-05-07 | Open |
| TD-50 | `SupabasePostRepository` and `SupabaseAuthService` have no adapter-level tests (only `pnpm typecheck` + downstream use-case fakes guard them). Pure helpers (`mapPostRow`, `cursor.ts`, `mapAuthError`) deserve unit tests. Adding vitest to `@kc/infrastructure-supabase` is a small, focused slice. | Med | P0.4-BE 2026-05-08 | Open |
| TD-41 | **AUDIT-X-01** — `is_blocked()` and `is_following()` are `SECURITY DEFINER` functions that bypass RLS (intentional, per P0.2.c — see §4 entry). A predicate defect here would silently break the privacy contract: a blocked user could see posts, or a non-follower could see `FollowersOnly` content, with no RLS error to flag it. Mitigation: add SQL probes (e.g. fixtures + assertions inside a vitest suite under `@kc/infrastructure-supabase`) covering: (a) `is_blocked(A,B)` returns true when A blocks B, (b) `is_following(A,B)` honors `accepted` follows but not `pending` ones, (c) `is_post_visible_to()` short-circuits on either side of a block. To wire when P0.4-FE first exercises FollowersOnly visibility paths end-to-end. | Med | Audit 2026-05-07 (X-01) | Open |
| TD-42 | **AUDIT-P2-08** — Counter cards in `apps/mobile/app/(tabs)/profile.tsx` render literal `0` rather than reading from `users.followers_count`, `users.following_count`, `users.items_given_count`, `users.items_received_count`, and `active_posts_count_for_viewer(owner, viewer)`. The triggers shipped in P0.2.f and the columns are populated, but the UI was never bound. Resolve as part of P0.4-FE (My Profile slice — once `IUserRepository.findById` is wired) or split into P2.4 if the FE plan grows. Watch out for FR-PROFILE-013 / TD-39 — non-owner viewers must read via `active_posts_count_for_viewer()`, never the raw `_internal` column. | Low | Audit 2026-05-07 (P2-08) | Open |
| TD-43 | **AUDIT-P3-07** — `docs/SSOT/SRS.md` Last-Updated header still shows `2026-05-05`, but new ACs were added on 2026-05-07 per the §4 "UX polish" entry (FR-AUTH-003 AC5 — Google identity on AuthSession; FR-PROFILE-001 AC4 + AC6 — avatar/displayName fallback). Bump the date and scan the `02_functional_requirements/` files for any other un-stamped edits. One-minute fix. | Low | Audit 2026-05-07 (P3-07) | Open |
| TD-51 | Domain code uses raw `throw new Error(...)` in `packages/domain/src/value-objects.ts:112-113` (`createAddress` validation). `srs-architecture.mdc` requires typed error classes (e.g. `DomainError`, `ValidationError`). Introduce a base `DomainError` in `packages/domain/src/errors.ts` and replace the two raw throws. The `check-architecture.mjs` script enforces the rule going forward; these two lines are temporarily allowlisted. After fix, remove from `DOMAIN_ERROR_RULE.exemptLines`. | Low | CI arch enforcement 2026-05-08 | ✅ Resolved 2026-05-08 (`packages/domain/src/errors.ts` introduces `DomainError` (abstract) + `ValidationError`; `value-objects.ts` createAddress now throws `ValidationError` with field metadata; allowlist in `check-architecture.mjs` is empty — any future raw `throw new Error` in domain fails CI immediately) |

---

## 7. How to Update This Document

> **Read first**: [`.cursor/rules/project-status-tracking.mdc`](../../.cursor/rules/project-status-tracking.mdc).

When you finish (or partially finish) a feature:

1. **Move** the feature's row in §2 from `⏳ Planned` to `🟡 In progress` when you start, then to `🟢 Done` when it ships.
2. **Append** a §4 entry in the compact bullet format: SRS IDs · branch · tests · tech debt IDs · open gaps. No file lists (use git). No operator steps (use OPERATOR_RUNBOOK.md).
3. **Update §1** (Snapshot) — at minimum: Last Updated date, completion %, the relevant counter.
4. **Append §5** if a new decision was made.
5. **Append §6** for any `[PENDING REFACTOR]` you logged during the feature.
6. **Update §3** (Sprint Board) to reflect the current in-progress and up-next.

If the feature is partial, mark it `🟡 In progress` and list what is left in §3 "In progress".

---

## 8. Status Legend

- 🟢 **Done** — all ACs verified, tests green, deployed/merged.
- 🟡 **In progress** — actively being implemented in the current sprint.
- ⏳ **Planned** — in the backlog, not yet started.
- 🔴 **Blocked** — cannot proceed; document the blocker inline.
- ⚠️ **Regression risk** — done previously but recent changes may have broken it; needs verification.

---

*See [`SRS.md`](./SRS.md) for the full requirement specification, [`PRD_MVP_SSOT_/`](./PRD_MVP_SSOT_/00_Index.md) for product intent, and `.cursor/rules/` for enforcement.*
