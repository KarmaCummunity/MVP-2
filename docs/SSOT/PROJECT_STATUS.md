# Project Status — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Document Status** | SSOT — actively maintained, **mandatory update** by every agent on every feature change |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-07 (guest preview) |
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

## 1. Snapshot — Current State (2026-05-07)

| Metric | Value |
| ------ | ----- |
| MVP completion (rough) | **~13%** (UI scaffolding done, no real backend integration yet) |
| Features 🟢 done | 2 |
| Features 🟡 in progress | 0 |
| Features 🔴 blocked | 0 |
| P0 critical features remaining | 5 |
| Test coverage | use-case tests for `auth.*` only |
| Open tech-debt items | 3 |

### What works end-to-end today

- Monorepo build (`pnpm typecheck` passes)
- **Native dev builds on iOS 26 + Android API-36 + Web** — all three platforms run correctly with Expo SDK 54 + expo-router 6
- All 27 MVP screens have UI scaffolding with mock data
- **Guest preview (peek feed)** — unauthenticated users open `(guest)/feed` with 3 public posts, join modal on card tap (`FR-AUTH-014`)

### What is fake / stubbed

- All non-auth screens still consume mock data (`apps/mobile/src/mock/data.ts`), including guest preview (`FR-AUTH-014`)
- No Supabase database schema / migrations / RLS yet
- No real CRUD for posts, follows, chats, reports, notifications, stats
- Google / Apple / Phone-OTP sign-in routes still call email sign-in screen as a placeholder
- Forgot-password flow not implemented
- Onboarding wizard (post-signup) is bypassed (lands on tabs directly)

---

## 2. Priority Backlog

Priority bands are **strict**: P0 must finish before P1 starts in earnest.

### 🔥 P0 — Critical path (MVP cannot ship without these)

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P0.1 | Real email/password authentication + session lifecycle | FR-AUTH-006, 007, 013, 017 | 🟢 Done (2026-05-06) | See §4 entry |
| P0.2 | Database schema, RLS policies, migrations | (Cross-cutting — all FRs depend) | ⏳ Planned | Blocks every server-backed feature |
| P0.3 | Onboarding wizard (basic info + photo + tour) wired to backend | FR-AUTH-010, 011, 012, 015 | ⏳ Planned | Currently skipped — lands on tabs |
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
| P3.1 | Google SSO sign-up / sign-in | FR-AUTH-003 | ⏳ Planned | Google Cloud OAuth client |
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
| In progress | — | — | — | — |
| Up next | P0.2 — Database schema + RLS | — | — | — |

---

## 4. Completed Features Log

Append-only. **Newest at top.**

### ✅ FR-AUTH-014 (+ FR-AUTH-001 AC3) — Guest preview feed

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-014, FR-AUTH-001 AC3 |
| PRD anchor | `03_Core_Features.md` §3.3.1.4, `05_Screen_UI_Mapping.md` §1.7 |
| Completed | 2026-05-07 |
| Branch / commit | (current working tree) |
| Files added | `app/packages/application/src/feed/selectGuestPreviewPosts.ts`, `app/packages/application/src/feed/__tests__/selectGuestPreviewPosts.test.ts`, `app/apps/mobile/app/(guest)/_layout.tsx`, `app/apps/mobile/app/(guest)/feed.tsx`, `app/apps/mobile/src/components/GuestJoinModal.tsx` |
| Files changed | `app/packages/application/src/index.ts`, `app/apps/mobile/app/_layout.tsx`, `app/apps/mobile/app/(auth)/index.tsx`, `app/apps/mobile/src/store/authStore.ts`, `app/apps/mobile/src/components/PostCard.tsx`, `docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md` (FR-AUTH-014 AC5) |
| Tech debt logged | NA |
| Tests | `app/packages/application`: `./node_modules/.bin/vitest run` → **16/16 passing**; `./node_modules/.bin/tsc --noEmit` → clean |
| AC verified | FR-AUTH-014 AC1–AC5, FR-AUTH-001 AC3 (manual: AuthGate allows `(guest)` while unauthenticated; peek button navigates; authenticated users leaving guest group → tabs) |
| Known gaps | Overlay does not yet wire `FR-FEED-014` live community count (copy uses static `guestBanner` string); SSO still placeholder (P3.1–P3.3) |

---

### ✅ FR-AUTH-006 / 007 / 013 / 017 — Email/password authentication + session lifecycle

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-006, FR-AUTH-007, FR-AUTH-013, FR-AUTH-017 |
| PRD anchor | `03_Core_Features.md` §3.1.1, §3.5 |
| Completed | 2026-05-06 |
| Branch / commit | (current working tree, pre-commit) |
| Files added | `packages/application/src/auth/*.ts` (5), `packages/application/src/ports/IAuthService.ts`, `packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts`, `apps/mobile/src/services/authComposition.ts`, plus 4 unit-test files |
| Files changed | `apps/mobile/app/_layout.tsx`, `(auth)/sign-in.tsx`, `(auth)/sign-up.tsx`, `settings.tsx`, `src/store/authStore.ts`, `src/i18n/he.ts` |
| Tech debt logged | See §6 entries TD-1, TD-2, TD-3 |
| Tests | `pnpm --filter @kc/application test` → **13/13 passing** (vitest 2.1.9). `pnpm --filter @kc/application typecheck` → clean. |
| Verified | Application-layer typecheck clean. Pre-existing typecheck errors in `infrastructure-supabase/client.ts` and mobile (DOM lib + 2 untouched screens) logged as TD-6/TD-7/TD-8. |
| AC verified (logically) | AC1–AC5 of FR-AUTH-006 (except breached-passwords → TD-2), AC1–AC4 of FR-AUTH-007 (email path), AC1–AC3 of FR-AUTH-013 (deep-link race → TD-3), AC1–AC3 of FR-AUTH-017 (server-side revoke handled by Supabase) |
| Known gaps (kept in P2/P3 backlog) | Forgot-password (P2.3), email-verification gating with `pending_verification` banner (P2.x — needs DB schema), breached-passwords check at sign-up (logged as TD-2), session-revoke deep-link races (TD-3), Google/Apple/Phone SSO flows still route to email screens (P3.1/P3.2/P3.3) |

---

## 5. Decisions Made During Execution

Mirror of [`SRS/appendices/C_decisions_log.md`](./SRS/appendices/C_decisions_log.md) entries that originated during MVP execution. Add new decisions here **and** in the SRS appendix.

| ID | Decision | Origin | Date |
| -- | -------- | ------ | ---- |
| EXEC-1 | Session storage on mobile uses `@react-native-async-storage/async-storage` (not `expo-secure-store`) per Supabase Expo guide; tokens are short-lived JWTs with rotating refresh tokens | P0.1 | 2026-05-06 |
| EXEC-2 | Auth use-cases live in `@kc/application/auth/*.ts` (one file per use case, ≤200 lines) — pure orchestration, all I/O via `IAuthService` port | P0.1 | 2026-05-06 |
| EXEC-3 | Vitest chosen as the unit-test runner for `@kc/domain` and `@kc/application` (lightweight, native ESM, fast) | P0.1 | 2026-05-06 |

---

## 6. Tech Debt Log

Mirror / pointer to [`CODE_QUALITY.md`](./CODE_QUALITY.md) (which does not exist yet — see TD-4). Add `[PENDING REFACTOR]` entries here as discovered.

| ID | Item | Severity | Origin | Status |
| -- | ---- | -------- | ------ | ------ |
| TD-1 | `database.types.ts` is a stub (`type Database = any`) — must be regenerated from real schema once §P0.2 lands | High | P0.1 | Open |
| TD-2 | FR-AUTH-006 AC1 requires breached-passwords check; not implemented (Supabase doesn't expose this OOTB; need HIBP API integration) | Med | P0.1 | Open |
| TD-3 | FR-AUTH-013 AC1 races with deep-links: cold-start session check happens before deep-link routing; needs `expo-router` redirect-with-state pattern | Med | P0.1 | Open |
| TD-4 | `docs/SSOT/CODE_QUALITY.md` is referenced from SRS.md but does not exist. Needs to be authored with: layer responsibilities, file-size cap policy, error mapping table, testing strategy, ADR template | High | Audit | Open |
| TD-5 | `apps/mobile/src/mock/data.ts` is consumed by ~5 screens; each must be migrated to real repositories during their respective P0 features | Med | Audit | Open |
| TD-6 | `packages/infrastructure-supabase/src/client.ts` has pre-existing TS errors: (a) `ConstructorParameters<typeof createClient>[2]` generic constraint mismatch with `@supabase/supabase-js@2.69`, (b) `process.env` references without `@types/node`. Fix during P0.2 (DB schema work) by tightening the storage adapter typing and adding `@types/node` as a dev dep on the infra package | Med | P0.1 verify | Open |
| TD-7 | `apps/mobile/app/(auth)/index.tsx` and `apps/mobile/app/(tabs)/create.tsx` used `'/(tabs)/'` (with trailing slash) which violated `expo-router` typed-routes mode | Low | Audit | ✅ Resolved 2026-05-06 (lint cleanup pass) |
| TD-8 | Mobile typecheck shows duplicate-identifier errors in `lib.dom.d.ts` (`URLSearchParams`, `RequestInfo`, `XMLHttpRequestResponseType`) due to React Native + DOM type collision. Cascades into false "Promise constructor not found" errors. Standard RN+TS pitfall; fix by adjusting `tsconfig.json` `lib` to drop `DOM` or by upgrading `@types/react-native` typings | Med | P0.1 verify | Open |
| TD-9 | `android/` is gitignored (CNG workflow). Must run `expo run:android` with `JAVA_HOME=.../temurin-17.jdk`. Pinned in `package.json android` script. If CI added, set `JAVA_HOME` env var there too. | Low | 2026-05-06 | Open |

---

## 7. How to Update This Document

> **Read first**: [`.cursor/rules/project-status-tracking.mdc`](../../.cursor/rules/project-status-tracking.mdc).

When you finish (or partially finish) a feature:

1. **Move** the feature's row in §2 from `⏳ Planned` to `🟡 In progress` when you start, then to `🟢 Done` when it ships.
2. **Append** a §4 entry with: SRS IDs, completed date, files added/changed, tests, AC verified, gaps deferred.
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
