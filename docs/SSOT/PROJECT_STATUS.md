# Project Status — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Document Status** | SSOT — actively maintained, **mandatory update** by every agent on every feature change |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-11 (feat: edit-post — ✏️ ערוך in owner ⋮ menu + edit-post/[id].tsx form (FR-POST-008, FR-POST-015 AC1); closes TD-130). Preceded by: 2026-05-11 (fix: AnchoredPostCard — banner now tappable for post owner + ClosureSheet rendered in chat context so "סמן כנמסר/שקיבלתי" CTA actually opens the closure flow; closureStore gains `initiator` field to prevent OwnerActionsBar's done-handler from firing for chat-initiated closures; FR-CHAT-014, FR-CHAT-015, FR-CLOSURE-001 #66). Preceded by scope-trim **`EXEC-9`** — removes per-user block / unblock from MVP (#65). Preceded by P1.2.y — realtime rejoin fix; P1.2.x — chat-post anchor lifecycle 🟢 Done across PRs #59 + #60 + #61; P1.9 — close post from chat #57; P1.2 — feed discovery; P1.1.2 — follow-surface cross-platform confirm/notify modals.) |
| **Last Updated** | 2026-05-11 (P2.2 — Delete Account V1: FR-SETTINGS-012 partial. Immediate hard-deletion flow with chat retention on counterpart side via `chats.participant_a/b ON DELETE SET NULL` (migration 0028 + NULL-safe RLS rewrites of `is_chat_visible_to`, `messages_insert_user`, `messages_update_status_recipient`, `chats_insert_self`, `chats_canonical_order`); `delete_account_data()` SECURITY DEFINER RPC (migration 0029, revoked from public + granted authenticated, blocks `suspended_*`/`banned` to prevent moderation evasion, snapshots `actor_id` in metadata, idempotent early-return on retry); `delete-account` Edge Function orchestrating RPC → storage (post-images + avatars) → `auth.admin.deleteUser`; typed-confirm modal ("מחק") with 6 states incl. non-dismissible `error_critical` for auth-delete failures; 1.5s success overlay; `participantIds: [string | null, string | null]` propagated through domain + adapters. Council-reviewed across 4 dimensions; cooldown / purge / email / orphan storage / recovery window deferred to V1.1. PR #68.) Preceded by AnchoredPostCard fix — banner tappable for post owner + ClosureSheet rendered in chat context + closureStore `initiator` field (FR-CHAT-014/015, FR-CLOSURE-001 #66). Preceded by scope-trim **`EXEC-9`** — removes per-user block / unblock from MVP (#65). Preceded by P1.2.y — realtime rejoin fix; P1.2.x — chat-post anchor lifecycle 🟢 Done across PRs #59 + #60 + #61; P1.9 — close post from chat #57; P1.2 — feed discovery; P1.1.2 — follow-surface cross-platform confirm/notify modals.) |
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

## 1. Snapshot — Current State (2026-05-11)

| Metric | Value |
| ------ | ----- |
| MVP completion (rough) | **~63%** (UI scaffolding + 2 auth paths + guest preview + **full onboarding** + Posts CRUD + Chat + **closure flow** + **Following + Other-User Profile** + **Feed discovery experience**; DB schema applied through 0023) |
| Features 🟢 done | 12 (P0.1..0.6 + P3.1 + P3.4 + P4.1 + P1.8 + P1.1 + P1.2 + P1.9 + P1.2.x) |
| Features 🟡 in progress | 0 |
| Features 🔴 blocked | 0 |
| P0 critical features remaining | 0 — all P0 shipped |
| Test coverage | use-case tests for `auth.*` + `posts.*` + `feed.*` (incl. geo + active counter + nudge) + `chat.*` + `closure.*` + `follow.*` — **163 vitest passing** (down from 168 — Block use-case tests + the `blocked` follow-state test + the closure block-filter tests removed with the feature) |
| Open tech-debt items | **40 active** (3 partial), **23 resolved** — see [`TECH_DEBT.md`](./TECH_DEBT.md) |

### What works end-to-end today

- Monorepo build (`pnpm typecheck` passes); `pnpm lint:arch` enforces ≤200-LOC + domain-error rules
- **Home Feed discovery (P1.2)** — TopBar filter/sort icon opens a bottom-sheet with sort (חדש/ישן/לפי מיקום), type, multi-category, item conditions (when Give), location filter (city + 5/10/25/50/100 km radius), and 3-mode status (פתוח/סגור/הכל). Distance ranking via the new `feed_ranked_ids` RPC (Haversine over `cities_geo`). Realtime "↑ N פוסטים חדשים" pill bumps on new public-post INSERTs, refetches on tap. First-post nudge with three-tier dismiss (CTA / session / permanent). Warm empty state with adaptive CTAs and live community counter. Pull-to-refresh on native; web refresh button + `R` shortcut.
- Native dev builds on iOS 26 + Android API-36 + Web — all three platforms run correctly with Expo SDK 54 + expo-router 6
- **Posts CRUD** — feed list (grid cards now render the first uploaded image; filters via `filterStore`), post detail (paged image carousel for multi-image posts via `PostImageCarousel`), create form (canonical `<CityPicker>`, regex-validated street number, location-display-level chooser, optional images for Request, disabled-until-valid Publish), image upload (gallery → resize 2048px → JPEG re-encode → Storage), My Profile My Posts list, guest feed — all consuming `SupabasePostRepository` via the 6 use cases in `@kc/application/posts/*`. Adapter maps Postgres FK/CHECK/RLS errors to typed `PostError` codes for Hebrew surfacing. Post detail now exposes a role-aware ⋮ overflow menu (FR-POST-014 AC4 + FR-POST-015 AC1): viewer → דווח; owner → ✏️ ערוך (FR-POST-008, opens `edit-post/[id]`) + מחק; super-admin viewing someone else's post → דווח + הסר כאדמין (FR-ADMIN-009 via the new admin_remove_post RPC).
- **Guest preview** — unauthenticated users open `(guest)/feed` with up to 3 live public posts, join modal on card tap (FR-AUTH-014)
- **Following + Other-User Profile** — full follow mechanism (instant for Public, request/accept/reject/14d-cooldown for Private), remove-follower, follow-state machine, Followers + Following lists with search, /settings/privacy toggle + /settings/follow-requests inbox. Other-user profile rebuilt to feature-parity with My Profile (closed posts visible too — per EXEC-7). **P1.1.1 polish (2026-05-11)**: end-to-end audit + three closures — (1) migration 0023 adds `users_after_privacy_mode_change` trigger that batch-transitions every pending follow_request → `accepted` when its target toggles `Private → Public`, closing FR-PROFILE-006 AC2 (existing `follow_requests_after_accept` trigger then fan-outs each into `follow_edges` rows, counters update via 0006); (2) Follow button is now optimistic (TD-125) — `qc.setQueryData` snapshots+predicts `follow-state` and `profile-other.followersCount` before the await, rollback in `catch`; (3) cooldown error toast now shows remaining days (TD-126).

### What is in flight

_None — pick the next item from §2._

### What is fake / stubbed

- My Profile (`(tabs)/profile.tsx`) now renders real biography + real followers/following counters via `findById` (closed TD-42 + TD-10, 2026-05-10); items_given/items_received remain 0 there because the layout doesn't surface them
- No closure flow / reports / notifications / community stats
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
| P0.5 | Direct chat with realtime | FR-CHAT-001…008 | 🟢 Done (2026-05-10) | Merged in PR #31; polished in PR #35; web-defect repair 2026-05-10 (header centering, ⋮-menu reachable on web, parallel chat-open, latest-message-on-entry). Defers: push notifs (P1.5/TD-115), full report flow (P1.3/TD-116), report-summary system message (P1.3/TD-117). |
| P0.6 | Closure flow (mark as delivered + reopen + cleanup cron) | FR-CLOSURE-001…005, 008, 009 | 🟢 Done (2026-05-10) | Branch `feat/FR-CLOSURE-001-closure-flow`. Polish 2026-05-10: profile grid + counter auto-refresh after close/reopen (cache invalidation in `OwnerActionsBar`); post-detail pops back after successful close. Defers: notify on mark (P1.5/TD-119), recipient un-marks self (P2.x/TD-120), suspect flag (P1.3/TD-121), storage orphan reconcile (TD-122), telemetry events (TD-123). |

### 📈 P1 — High priority (PMF quality)

| # | Feature | SRS IDs | Status | Notes |
| - | ------- | ------- | ------ | ----- |
| P1.1 | Following + follow-requests (private profiles) | FR-FOLLOW-001…009, 011, 012; FR-PROFILE-002…006, 009, 010, 013 | 🟢 Done (2026-05-11) | Branch `claude/loving-varahamihira-01cd6d`. 25 commits, 35 vitest. Closes TD-14, TD-40 (partial); opens TD-124..TD-127 (push deferred + optimistic updates + cooldown UX + Report from ⋮ menu). **Polish 2026-05-11 (P1.1.1)**: migration 0023 closes FR-PROFILE-006 AC2 (auto-approve pending requests on Private→Public via DB trigger); TD-125 (optimistic Follow button) + TD-126 (cooldown days-remaining toast) closed. **Hotfix 2026-05-11 (P1.1.2)**: cross-platform `Alert.alert` replacement (TD-138 opened for the sweep) + optimistic My Profile follower-count. TD-124 (push) + TD-127 (Report) remain deferred to P1.5 / P1.3. |
| P1.2 | Feed discovery — filter sheet + Haversine sort + realtime + warm empty + first-post nudge + community counter | FR-FEED-004, 005, 006, 008, 009, 010, 014, 015, 018, 019 (new); deprecates 003, 007, 013; supersedes 016 | 🟢 Done (2026-05-11) | Branch `feat/FR-FEED-006-feed-discovery-and-filters`. 4 commits, 18 vitest. Closes TD-26 + TD-102; opens TD-134..TD-137 for deferred analytics, edge-cached counter, search-tab filter parity, and SearchFilterSheet split (legacy TD-133 evolves). |
| P1.3 | Reports + auto-removal + false-report sanctions | FR-MOD-001…008, 010 | ⏳ Planned | Safety floor. `FR-MOD-010` relocated here from the deleted P1.4 row per `EXEC-9`. |
| ~~P1.4~~ | ~~Block / unblock + visibility restoration~~ | ~~FR-MOD-009, 010~~ | ❌ Out of MVP | Removed per `EXEC-9` (2026-05-11). `FR-MOD-003/004/009` deprecated; `FR-MOD-010` moved to P1.3. |
| P1.5 | Push notifications (Critical + Social) | FR-NOTIF-001…006 | ⏳ Planned | |
| P1.6 | Personal & community stats | FR-STATS-001…004 | ⏳ Planned | |
| P1.7 | Donations Hub + Search tab placeholder + 5-tab bottom bar | FR-DONATE-001…005, FR-FEED-016, FR-CHAT-008 (extended) | ⏳ Planned (parked pending TD-114) | Per `D-16` (2026-05-09). Wire-up of volunteer-composer → support thread deferred to a separate post-P0.5 PR once `OpenOrCreateChatUseCase` + `GetSupportThreadUseCase` are merged. |
| P1.8 | Donation categories + community NGO link lists | FR-DONATE-006…009 | 🟢 Done (2026-05-10) | 6 new tiles (אוכל, דיור, תחבורה, ידע, חיות, רפואה) + community-curated link list per category (auto-publish + Edge-Function URL reachability). DB-backed; lists also added to existing Time/Money screens. |
| P1.9 | Close post from chat | FR-CHAT-014, FR-CHAT-015, FR-CLOSURE-001 ext. | 🟢 Done (2026-05-11) | Merged via #57. Anchored-post card in chat header + close-post-from-chat entry point + system messages on close/reopen. Anchor-lifecycle gap surfaced post-merge closed by P1.2.x (PRs #59 + #60 + #61). |
| P1.2.x | Chat-post anchor lifecycle — re-anchor on reuse + clear on close | FR-CHAT-014 AC6, FR-CLOSURE-001 AC5 | 🟢 Done (2026-05-11) | Shipped across PRs #59 + #60 + #61. Migration 0026 (clear anchor on close) + 0027 (SECURITY DEFINER RPC for re-anchor — `chats` has no client UPDATE grant per 0004 §12) + `SupabaseChatRepository.findOrCreateChat` re-anchors via RPC on reuse + `SupabaseChatRealtime.subscribeToChat` emits `onChatChanged`. No new TD opened. Spec: [`2026-05-11-chat-post-anchor-lifecycle-design.md`](../superpowers/specs/2026-05-11-chat-post-anchor-lifecycle-design.md). |

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
| P4.1 | `react-native-web` parity + Railway deploy at `dev3.karma-community-kc.com` | NFR-PLAT-* | 🟢 Done (2026-05-10) |

---

## 3. Sprint Board (current)

| Slot | Feature | Owner | Started | Target |
| ---- | ------- | ----- | ------- | ------ |
| In progress | — | — | — | — |
| Up next | P1.3 — Reports + auto-removal + false-report sanctions | — | — | — |

Most recently shipped: **P2.2 Delete Account V1** — FR-SETTINGS-012 partial (immediate hard-delete + chat retention via FK SET NULL + typed-confirm modal + suspended-block gate; cooldown/purge/email deferred to V1.1; migrations 0028 + 0029 + `delete-account` Edge Function — 2026-05-11, #68). Preceded by **Scope-trim** — block / unblock removed from MVP per `EXEC-9` (FR-MOD-003/004/009 + NFR-PRIV-009 + INV-M1 + FR-SETTINGS-005 deprecated; D-11 superseded; FR-MOD-010 relocated to P1.3 — 2026-05-11, #65). Preceded by **P1.2.y** — Realtime rejoin fix (FR-FEED-009 + FR-CHAT-003/011/012 latent; unique-topic channels + `client.removeChannel` + AppState resume guard — 2026-05-11). Preceded by **P1.2.x** — Chat-post anchor lifecycle (FR-CHAT-014 AC6 + FR-CLOSURE-001 AC5; migrations 0026 + 0027 + adapter re-anchor via SECURITY DEFINER RPC + `onChatChanged` realtime — 2026-05-11, PRs #59 + #60 + #61). Preceded by **P1.9** — Close post from chat (FR-CHAT-014, FR-CHAT-015, FR-CLOSURE-001 ext.; anchored-post card + close-from-chat entry + system messages — 2026-05-11, #57). Preceded by **P1.1.2** — follow-mechanism web hotfix (Alert.alert no-op replaced with ConfirmActionModal + NotifyModal across the follow surface; My Profile follower-count now optimistic — 2026-05-11). Preceded by **P1.1.1** (follow-mechanism end-to-end audit + polish — migration 0023 + TD-125 + TD-126). Preceded by **P1.2** (Feed discovery experience — FR-FEED-004/005/006/008/009/010/014/015/018/019; TopBar filter sheet + Haversine sort + realtime banner + first-post nudge + live community counter — 2026-05-11). Preceded by **P1.1** (Following + Other-User Profile — FR-FOLLOW-001..009, 011, 012 + FR-PROFILE-002..006, 009, 010, 013 — 2026-05-11). Full log in [`HISTORY.md`](./HISTORY.md).

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
| EXEC-6 | P0.5 chat: two-port split (`IChatRepository` + `IChatRealtime`). Subscriptions stay out of use cases — managed by Zustand `chatStore` directly. Use cases remain pure (input → `Promise<output>`). | P0.5 design | 2026-05-10 |
| EXEC-7 | פוסטים סגורים מוצגים בפרופיל של יוזר אחר (ציבורי או פרטי-עוקב-מאושר), כולל זהות המקבל. מהפכת את החלטת ה-PRD §3.2.2. | P1.1 | 2026-05-11 |
| EXEC-8 | מיון פיד "לפי מיקום" עובר ל-Haversine מ-centroid של עיר (lat/lon ב-`public.cities`, פונקציה `haversine_km`), מבטל את האיסור המקורי על geocoding ב-FR-FEED-006 AC2. הסרת חיפוש החופשי מהפיד הראשי (FR-FEED-003 deprecated); FR-FEED-016 משופץ לתאר את מנגנון החיפוש האוניברסלי הקיים בפועל בלשונית. שבב הפילטרים הפעילים בפיד מוחלף בתג ספירה אדום על אייקון הפילטר ב-TopBar (FR-FEED-013 deprecated). Cold-start fallback (FR-FEED-007) מבוטל — המיון לפי מרחק מטפל בעיר דלילה. First-post nudge מקבל שלוש רמות-dismiss (CTA / sesssion / permanent). | P1.2 | 2026-05-11 |
| EXEC-9 | חסימה / ביטול חסימה יוצאים מהיקף ה-MVP. P1.4 נמחק מה-backlog; `FR-MOD-003`, `FR-MOD-004`, `FR-MOD-009`, `NFR-PRIV-009`, `INV-M1`, `FR-SETTINGS-005` סומנו `DEPRECATED — post-MVP`; `D-11` superseded. `FR-MOD-010` (false-report sanctions) הועבר ל-P1.3 (ה-row שאליו הוא משתייך לוגית). הקוד נמחק; הסכמה ב-DB נשארת כפי שהיא (כבר ב-prod, drop נושא סיכון, מחזיר `false` תמיד עד שיוחזרו פוסט-MVP). | scope-trim | 2026-05-11 |

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
