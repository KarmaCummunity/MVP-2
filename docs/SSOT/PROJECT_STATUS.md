# Project Status — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Document Status** | SSOT — actively maintained, **mandatory update** by every agent on every feature change |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-09 (Create-post end-to-end fix — `<CityPicker>` replaces free-text city (FK 400 was blocking every publish), `street_number` regex validation, `<LocationDisplayLevelChooser>`, optional images for Request, Publish disabled-until-valid, typed Postgres-error mapping. TD-101/103/104/105 closed. Earlier today: FR-PROFILE-007 partial, TD-110 permission UX, D-16 Donations + Search tabs, TD-109 emoji→Ionicons.) |
| **Source of Truth (Requirements)** | [`SRS.md`](./SRS.md) → [`SRS/02_functional_requirements/`](./SRS/02_functional_requirements/) |
| **Source of Truth (Product)** | [`PRD_MVP_CORE_SSOT/`](./PRD_MVP_CORE_SSOT/00_Index.md) |
| **Active tech debt** | [`TECH_DEBT.md`](./TECH_DEBT.md) — scan before opening a PR |
| **Completed feature log** | [`HISTORY.md`](./HISTORY.md) — append-only |
| **Architecture Rules** | [`.cursor/rules/srs-architecture.mdc`](../../.cursor/rules/srs-architecture.mdc) |
| **Update Rules** | [`.cursor/rules/project-status-tracking.mdc`](../../.cursor/rules/project-status-tracking.mdc) |

---

## 0. Purpose

This document is the **single source of truth for project execution state**. It answers three questions for any agent (human or AI) before they start work:

1. **Where are we now?** (current sprint + in-flight work)
2. **What was already done?** (so we don't redo it — full log in [`HISTORY.md`](./HISTORY.md))
3. **What is next, in priority order?** (so we always pick the highest-leverage task)

> **MANDATORY**: Every agent that adds, fixes, or modifies a feature MUST update this document in the same change-set. The Cursor rule [`project-status-tracking`](../../.cursor/rules/project-status-tracking.mdc) enforces this.

---

## 1. Snapshot — Current State (2026-05-09)

| Metric | Value |
| ------ | ----- |
| MVP completion (rough) | **~42%** (UI scaffolding + 2 auth paths + guest preview + **full onboarding (basic info + photo + tour + soft gate)**; DB schema applied; Posts BE adapter + FE end-to-end) |
| Features 🟢 done | 6 (P0.3 fully done — slice A + B + C) |
| Features 🟡 in progress | 0 |
| Features 🔴 blocked | 0 |
| P0 critical features remaining | 2 (P0.5 chat; P0.6 closure) |
| Test coverage | use-case tests for `auth.*` + `posts.*` + `feed.*` — 68 vitest passing |
| Open tech-debt items | **34 active** (3 partial), **17 resolved** — see [`TECH_DEBT.md`](./TECH_DEBT.md) |

### What works end-to-end today

- Monorepo build (`pnpm typecheck` passes); `pnpm lint:arch` enforces ≤200-LOC + domain-error rules
- Native dev builds on iOS 26 + Android API-36 + Web — all three platforms run correctly with Expo SDK 54 + expo-router 6
- **Posts CRUD** — feed list (with filters via `filterStore`), post detail, create form (canonical `<CityPicker>`, regex-validated street number, location-display-level chooser, optional images for Request, disabled-until-valid Publish), image upload (gallery → resize 2048px → JPEG re-encode → Storage), My Profile My Posts list, guest feed — all consuming `SupabasePostRepository` via the 6 use cases in `@kc/application/posts/*`. Adapter maps Postgres FK/CHECK/RLS errors to typed `PostError` codes for Hebrew surfacing.
- **Guest preview** — unauthenticated users open `(guest)/feed` with up to 3 live public posts, join modal on card tap (FR-AUTH-014)

### What is fake / stubbed

- Chat list + thread still consume local `MOCK_MESSAGES` inside `chat/[id].tsx` (P0.5 retires this)
- Other-user profile (`/user/[handle]`) is a P2.4 placeholder until `IUserRepository.findByHandle` ships (TD-40)
- Profile counters: followers / following / items_given / items_received still render `0` (TD-42 — needs `IUserRepository.findById`, P2.4)
- No closure flow / chat realtime / reports / notifications / community stats
- Apple / Phone-OTP sign-in routes still call email sign-in screen as placeholder (Google SSO is real)
- Forgot-password flow not implemented
- EXIF metadata is stripped client-side (re-encode side effect); server-side strip per FR-POST-005 AC4 requires an Edge Function (TD-23)

---

## 2. Priority Backlog

Priority bands are **strict**: P0 must finish before P1 starts in earnest.

### 🔥 P0 — Critical path (MVP cannot ship without these)

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P0.1 | Real email/password authentication + session lifecycle | FR-AUTH-006, 007, 013, 017 | 🟢 Done (2026-05-06) | |
| P0.2 | Database schema, RLS policies, migrations | (Cross-cutting) | 🟢 Done (2026-05-07) | All migrations 0001–0008 applied |
| P0.3 | Onboarding wizard (basic info + photo + tour) wired to backend | FR-AUTH-010, 011, 012, 015 | 🟢 Done (2026-05-08) | All slices A + B + C shipped |
| P0.4 | Post creation + feed (real CRUD, RLS-aware) | FR-POST-001…010, FR-FEED-001…005 | 🟢 Done (2026-05-08) | BE + FE both shipped |
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
| P1.7 | Donations Hub + Search tab placeholder + 5-tab bottom bar | FR-DONATE-001…005, FR-FEED-016, FR-CHAT-008 (extended) | 🟡 In progress (this work) | Per `D-16` (2026-05-09). Light FE-only change; volunteer-message use-case reuses existing `FR-CHAT-007` admin thread. **Note:** while P0.5 chat is still mock-backed, the Time composer routes through the same ports — when P0.5 lands, no changes needed here. |

### 📊 P2 — Polish

| # | Feature | SRS IDs | Status |
| - | ------- | ------- | ------ |
| P2.1 | Settings (notifications, privacy, blocked users) wired to backend | FR-SETTINGS-001…007 | ⏳ Planned |
| P2.2 | Account deletion + 30-day cooldown | FR-AUTH-016 | ⏳ Planned |
| P2.3 | Forgot password (email) | FR-AUTH-008 | ⏳ Planned |
| P2.4 | Edit profile, privacy mode toggle | FR-PROFILE-001…007 | ⏳ Planned |
| P2.5 | Super-admin in-chat moderation | FR-ADMIN-001…003 | ⏳ Planned |
| P2.6 | Universal search engine (people + items + future categories) | `FR-FEED-017+` (TBD) | ⏳ Planned | Replaces the Search-tab placeholder (`FR-FEED-016`). Spec to be authored when prioritized. End-of-MVP scope per `D-16`. |

### 💎 P3 — Additional auth methods

| # | Feature | SRS IDs | Status | External setup needed |
| - | ------- | ------- | ------ | --------------------- |
| P3.1 | Google SSO sign-up / sign-in | FR-AUTH-003, 007 | 🟢 Done (2026-05-07) | OAuth (PKCE) via Supabase + `expo-web-browser` |
| P3.2 | Apple SSO (iOS only) | FR-AUTH-004 | ⏳ Planned | Apple Developer account |
| P3.3 | Phone OTP | FR-AUTH-005 | ⏳ Planned | Twilio / Supabase phone provider config |
| P3.4 | Guest preview | FR-AUTH-014 | 🟢 Done (2026-05-07) | Dedicated `(guest)/feed`, join modal, `selectGuestPreviewPosts` |

### 🌐 P4 — Cross-platform parity

| # | Feature | SRS IDs | Status |
| - | ------- | ------- | ------ |
| P4.1 | Dedicated web app shell (or document `react-native-web` parity) | NFR-PLAT-* | ⏳ Planned |

---

## 3. Sprint Board (current)

| Slot | Feature | Owner | Started | Target |
| ---- | ------- | ----- | ------- | ------ |
| In progress | **P1.7 — Donations + Search tabs (D-16)** | — | 2026-05-09 | — |
| Up next | P0.5 — Direct chat with realtime | — | — | — |
| Then | P0.6 — Closure flow | — | — | — |

Most recently shipped: **TD-109** (emoji → Ionicons across tab bar + EmptyState, fixes iOS-simulator tofu — 2026-05-09). Full log in [`HISTORY.md`](./HISTORY.md).

---

## 4. Decisions Made During Execution

Mirror of [`SRS/appendices/C_decisions_log.md`](./SRS/appendices/C_decisions_log.md) entries that originated during MVP execution. Add new decisions here **and** in the SRS appendix.

| ID | Decision | Origin | Date |
| -- | -------- | ------ | ---- |
| EXEC-1 | Session storage on mobile uses `@react-native-async-storage/async-storage` (not `expo-secure-store`) per Supabase Expo guide; tokens are short-lived JWTs with rotating refresh tokens | P0.1 | 2026-05-06 |
| EXEC-2 | Auth use-cases live in `@kc/application/auth/*.ts` (one file per use case, ≤200 lines) — pure orchestration, all I/O via `IAuthService` port | P0.1 | 2026-05-06 |
| EXEC-3 | Vitest chosen as the unit-test runner for `@kc/domain` and `@kc/application` (lightweight, native ESM, fast) | P0.1 | 2026-05-06 |
| EXEC-4 | Adopted parallel-agents coordination protocol (lanes, draft-PR claim mechanism, `(contract)` scope rule, TD-N range split, tiebreakers). Spec at `docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md`; pointer in `CLAUDE.md` | Two-agent setup | 2026-05-07 |
| EXEC-5 | Doc structure: `PROJECT_STATUS.md` is the live execution dashboard (≤120 lines); `HISTORY.md` is append-only feature log; `TECH_DEBT.md` is the active debt register grouped by area. CLAUDE.md points to all three | Doc cleanup | 2026-05-08 |
| D-16 | Reintroduce dedicated **Donations** and **Search** tabs in the bottom bar (5 tabs total). Search ships as a placeholder (`FR-FEED-016`); universal-search engine deferred to P2.6. Donations Hub ships fully (`FR-DONATE-001..005`); Time + Money are coming-soon screens with external partner links + volunteer-message composer wired to `FR-CHAT-007`. | Product | 2026-05-09 |

---

## 5. How to Update This Document

> **Read first**: [`.cursor/rules/project-status-tracking.mdc`](../../.cursor/rules/project-status-tracking.mdc).

When you finish (or partially finish) a feature:

1. **Move** the feature's row in §2 from `⏳ Planned` to `🟡 In progress` when you start, then to `🟢 Done` when it ships.
2. **Append** a feature entry to the **top** of [`HISTORY.md`](./HISTORY.md) in the compact bullet format: SRS IDs · branch/PR · tests · tech-debt deltas · open gaps. No file lists (use git). No operator steps (use OPERATOR_RUNBOOK.md).
3. **Update §1** (Snapshot) — at minimum: Last Updated date, completion %, the relevant counter, "What works"/"What is stubbed" if behavior changed.
4. **Append §4** if a new decision was made.
5. **Update [`TECH_DEBT.md`](./TECH_DEBT.md)** — close any TDs you resolved (move to Resolved); add new ones with the next free ID in your lane (BE: `TD-50..99`, FE: `TD-100..149`).
6. **Update §3** (Sprint Board) to reflect the current in-progress and up-next.

If the feature is partial, mark it `🟡 In progress` and list what is left in §3 "In progress".

---

## 6. Status Legend

- 🟢 **Done** — all ACs verified, tests green, deployed/merged.
- 🟡 **In progress** — actively being implemented in the current sprint.
- ⏳ **Planned** — in the backlog, not yet started.
- 🔴 **Blocked** — cannot proceed; document the blocker inline.
- ⚠️ **Regression risk** — done previously but recent changes may have broken it; needs verification.

---

*See [`SRS.md`](./SRS.md) for the full requirement specification, [`PRD_MVP_CORE_SSOT/`](./PRD_MVP_CORE_SSOT/00_Index.md) for product intent, [`HISTORY.md`](./HISTORY.md) for the completed-feature log, [`TECH_DEBT.md`](./TECH_DEBT.md) for active debt, and `.cursor/rules/` for enforcement.*
