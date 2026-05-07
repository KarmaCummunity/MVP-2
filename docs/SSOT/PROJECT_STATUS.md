# Project Status — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Document Status** | SSOT — actively maintained, **mandatory update** by every agent on every feature change |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-07 (P0.3.a polish — Skip on every onboarding screen, dynamic cities from `public.cities` (1,306 from data.gov.il via migration 0008), dev reset button + parallel-agents protocol adopted) |
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
| MVP completion (rough) | **~18%** (UI scaffolding + 2 auth paths + guest preview + onboarding slice A; DB schema written) |
| Features 🟢 done | 4 |
| Features 🟡 in progress | 0 |
| Features 🔴 blocked | 0 |
| P0 critical features remaining | 4 (P0.2 in progress; P0.4–P0.6 planned) |
| Test coverage | use-case tests for `auth.*` (incl. Google + onboarding), feed selector |
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
| P0.2 | Database schema, RLS policies, migrations | (Cross-cutting — all FRs depend) | 🟡 In progress | Decomposed into P0.2.a..f (see plan). **P0.2.a applied. P0.2.b + P0.2.c + P0.2.d + P0.2.e + P0.2.f written; awaiting operator apply** (`supabase db push`). All slices SQL-complete. |
| P0.3 | Onboarding wizard (basic info + photo + tour) wired to backend | FR-AUTH-010, 011, 012, 015 | 🟡 In progress | Slice A merged: Basic Info + Tour wired; Photo skip-stub. Slice B (photo upload) + slice C (FR-AUTH-015 soft gate) remain. |
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
| In progress | P0.2 — Database schema + RLS (a..f all written; a applied; b..f awaiting operator `db push`) | — | 2026-05-07 | — |
| In progress | P0.3 — Onboarding wizard (slice A merged; B = photo upload, C = FR-AUTH-015 soft gate) | — | 2026-05-07 | — |
| Up next | P0.4 — Post creation + feed CRUD | — | — | — |

---

## 4. Completed Features Log

Append-only. **Newest at top.**

### 🟢 P0.3.a polish — Skip on every screen, dynamic cities, dev reset

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-010 AC2 (canonical city list — now reads `public.cities` instead of a client-side constant), FR-AUTH-010 AC3 (Skip button on basic-info — was missing in slice A), FR-AUTH-011 AC3 (Skip button on photo, conditional state advance — only flips to `completed` when state is already `pending_avatar`), FR-AUTH-012 AC2 (Skip on tour was already correct). |
| PRD anchor | `03_Core_Features.md` §3.1.2 |
| Status | 🟢 Code merged. **Migration 0008 awaiting operator apply** (`supabase db push`). |
| Branch / commit | `fix/onboarding-polish` |
| Files added | `supabase/migrations/0008_seed_all_cities.sql` (1,400 lines — 1,306 city rows + slug→numeric backfill + `handle_new_user` trigger replacement), `app/packages/application/src/ports/ICityRepository.ts`, `app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts` |
| Files changed | `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts` (drops client-side list validation; takes `cityId + cityName` from caller), `app/packages/application/src/auth/__tests__/CompleteBasicInfoUseCase.test.ts` (boundary tests for empty cityId/cityName replace the now-impossible "unknown city_id" path), `app/packages/application/src/index.ts`, `app/packages/infrastructure-supabase/src/index.ts`, `app/apps/mobile/src/services/userComposition.ts` (adds `listCities`, `setOnboardingStateDirect`), `app/apps/mobile/src/components/CityPicker.tsx` (rewritten — search input + tanstack-query against `public.cities`), `app/apps/mobile/app/(onboarding)/basic-info.tsx` (Skip button; passes `{id, name}` from picker), `app/apps/mobile/app/(onboarding)/photo.tsx` (Skip button; only finalises onboarding when state is `pending_avatar`), `app/apps/mobile/app/_layout.tsx` (AuthGate loosened — only redirects from (auth)/(guest); FR-AUTH-015 will catch pending users elsewhere), `app/apps/mobile/app/settings.tsx` (`__DEV__`-gated "איפוס אונבורדינג" row), `docs/SSOT/PROJECT_STATUS.md` |
| Files deleted | `app/packages/domain/src/cities.ts` (the static `IL_CITIES` constant — superseded by `public.cities`) |
| Tech debt | None new. Closes a slice-A oversight where `IL_CITIES` was hard-coded against the SRS's "canonical Israeli city list" requirement. |
| Tests | `vitest run` in `@kc/application`: **25/25 passing** (one boundary test rewritten — net same count). `tsc --noEmit` clean across all 5 packages. |
| AC verified | FR-AUTH-010 AC2 (1,306 cities live in `public.cities`; picker queries them with search; no free-text path), AC3 (Skip on basic-info navigates to photo without writing; state stays `pending_basic_info`). FR-AUTH-011 AC3 (Skip on photo — state untouched if `pending_basic_info`, advanced to `completed` if `pending_avatar`). FR-AUTH-012 AC2 (Skip on tour, unchanged). |
| Known gaps | (a) **FR-AUTH-015 soft-gate modal** still required (slice C) — until it lands, a user who skipped basic-info is parked in `(tabs)` indefinitely until they hit the dev reset or a future soft-gate prompt; functionally OK for MVP testing, blocking only for spec compliance. (b) Photo full upload still deferred to slice B (FR-AUTH-011 AC1+AC2). (c) `__DEV__`-only reset button works in Expo dev builds but is hidden in production — production testers will need real account deletion (FR-AUTH-016 / P2.2). |
| Operator setup notes | `supabase db push` to apply 0008. The migration is idempotent; safe to re-run. After apply, regenerate `database.types.ts` so `cities` row types reflect the bulk-seeded data. Verify: (1) `select count(*) from public.cities;` returns ≥ 1,306; (2) any pre-existing test users with `users.city in ('tel-aviv','jerusalem',…)` were remapped to numeric codes; (3) creating a new auth user via the trigger inserts `city = '5000'`, `city_name = 'תל אביב - יפו'`. |

---

### 🟢 P0.3.a — Onboarding wizard (Basic Info + Tour, photo skip-stub)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-010 (basic info — display_name 1-50 chars, city dropdown via `IL_CITIES`, no free-text), FR-AUTH-011 (skip-only stub — current avatar from `user_metadata` is kept; full upload in slice B), FR-AUTH-012 (3-slide welcome tour with Skip on every slide), FR-AUTH-007 AC1+AC2 (returning users with `onboarding_state = completed` skip the wizard; `pending_basic_info` / `pending_avatar` resume at the right step). |
| PRD anchor | `03_Core_Features.md` §3.1.2, `05_Screen_UI_Mapping.md` §1.4–1.6 |
| Completed | 2026-05-07 |
| Branch / commit | `feat/FR-AUTH-010-onboarding-wizard` |
| Files added | `app/packages/domain/src/cities.ts`, `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts`, `app/packages/application/src/auth/CompleteOnboardingUseCase.ts`, `app/packages/application/src/auth/__tests__/{CompleteBasicInfoUseCase,CompleteOnboardingUseCase}.test.ts`, `app/packages/application/src/auth/__tests__/fakeUserRepository.ts`, `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`, `app/apps/mobile/src/services/userComposition.ts`, `app/apps/mobile/src/components/CityPicker.tsx`, `app/apps/mobile/app/(onboarding)/{_layout,basic-info,photo,tour}.tsx`, `docs/superpowers/plans/2026-05-07-p0-3-onboarding-wizard.md` |
| Files changed | `app/packages/domain/src/index.ts`, `app/packages/application/src/ports/IUserRepository.ts`, `app/packages/application/src/index.ts`, `app/packages/infrastructure-supabase/src/index.ts`, `app/apps/mobile/src/store/authStore.ts`, `app/apps/mobile/app/_layout.tsx`, `app/apps/mobile/app/(auth)/sign-in.tsx`, `app/apps/mobile/app/(auth)/sign-up.tsx`, `app/apps/mobile/app/auth/callback.tsx`, `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt | Adds **TD-40** below (`SupabaseUserRepository` non-onboarding methods are `not_implemented` stubs — populated incrementally during P0.4 / P1.1 / P1.4 / P2.4). |
| Tests | `vitest run` in `@kc/application`: **25/25 passing** (6 new — 4 for `CompleteBasicInfoUseCase`, 2 for `CompleteOnboardingUseCase`). `tsc --noEmit` clean across all 5 packages (`@kc/domain`, `@kc/application`, `@kc/infrastructure-supabase`, `@kc/ui`, `@kc/mobile`). |
| AC verified (logically) | FR-AUTH-010 AC1, AC2, AC4. FR-AUTH-011 AC3 (skip path keeps SSO/initials avatar), AC4 (SSO photo shown), AC5 (errors recoverable). FR-AUTH-012 AC1, AC2, AC3, AC4. FR-AUTH-007 AC2 (resume at right step on cold-start). |
| Known gaps | (a) **Photo full upload** (FR-AUTH-011 AC1+AC2 — camera/gallery + 1024px resize + JPEG q=85 + EXIF strip + Storage upload) ships in slice B. (b) **FR-AUTH-015 soft-gate modal** (re-prompt on first meaningful action when state is `pending_basic_info`) ships in slice C. (c) FR-AUTH-010 AC3 explicit "Skip" affordance is not yet rendered on the basic-info screen — until slice C lands the soft gate, killing the app at step 1 leaves the user in `pending_basic_info` and re-enters the wizard next launch (functionally equivalent to AC3, just less ergonomic). (d) `IUserRepository` non-onboarding methods (follows, blocks, identity lookup, full `findById/update/delete`) are stubbed — see TD-40. (e) The state-machine flips to `completed` at the end of step 2 (photo skip), not at the end of step 3 (tour); rationale documented in plan — tour is intentionally non-blocking and skippable. |
| Operator setup notes | None. Schema is unchanged. RLS on `users` already grants `update (display_name, city, city_name, onboarding_state, …)` to `authenticated` (per migration 0001 §7), and the `users_update_self` policy enforces `auth.uid() = user_id`. Verify after merging by signing up a fresh user via email → expect `(onboarding)/basic-info` → fill name + pick city → expect `(onboarding)/photo` → tap "המשך" → expect `(onboarding)/tour` → tap through 3 slides → land on `(tabs)`. Re-sign-in must skip the wizard. |

---

### 🟡 P0.2.f1 — Users Realtime publication + counter-column visibility gap (audit follow-up)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-PROFILE-013 AC5 (counters **projected via Realtime**), NFR-PERF-005 (≤2,000 ms Realtime freshness). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). The migration is fully guarded — safe to run on environments where `supabase_realtime` doesn't exist yet. |
| Branch / commit | `feat/p0-2-f1-users-realtime-and-td39` |
| Files added | `supabase/migrations/0007_users_realtime_publication.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md` (this entry + TD-39 below + Known-gaps update on P0.2.f) |
| Tech debt logged | TD-39 (below) — non-owner SELECT of internal counter columns is allowed by 0001's row-level `users_select_public` policy. Mitigation lives at the application repository layer (must use `active_posts_count_for_viewer()` instead of reading `active_posts_count_internal` directly). |
| AC verified | SQL static review only. Operator probe: after apply, `select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';` must include `users`. Then `update public.users set followers_count = followers_count where user_id = '<id>';` should fire a Realtime event for any subscriber on that row. |
| Known gaps | None new — see TD-39 for the column-visibility note. |
| Operator setup notes | `supabase db push`. Re-running 0007 is a no-op due to the `pg_publication_tables` guard. |

---

### 🟡 P0.2.f — Stats projections + counter triggers + community_stats (migration written, awaiting operator apply)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-STATS-001 (personal stats screen — three counter cards), FR-STATS-002 (counter semantics: `items_given_count` ± on closure transitions, `items_received_count` ± on Recipient row, `active_posts_count_internal` = open posts of any visibility, clamp-at-zero per AC4), FR-STATS-004 (community stats panel — `community_stats` view with `registered_users` / `active_public_posts` / `items_delivered_total`), FR-STATS-005 (drift recompute seam — `stats_safe_dec` raises NOTICE on clamp; nightly job ships separately), FR-STATS-006 (privacy — view selectable by anon+authenticated; counters projected via `users` RLS unchanged), FR-PROFILE-001 AC2 (profile header followers / following / active counters now maintained), FR-PROFILE-013 (public/internal active-posts split — viewer-aware via `active_posts_count_for_viewer(owner, viewer)`; never reveals OnlyMe presence to non-owners per AC4), FR-FEED-014 (active-community counter shares `community_stats.active_public_posts`), FR-FEED-015 (first-post nudge — partial index on `users.posts_created_total = 0 AND first_post_nudge_dismissed = false`), FR-CLOSURE-008 (data shape only — `posts_pending_hard_delete_idx` partial index for the future bg-job-soft-delete-cleanup Edge Function). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). After apply, regenerate `database.types.ts`. The migration is idempotent (backfill is a recompute from ground truth — safe to re-run). |
| Branch / commit | `feat/p0-2-f-stats-counters` (this commit) |
| Files added | `supabase/migrations/0006_init_stats_counters.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt logged | None new. Closes TD-21 (counter triggers complete, including the previously-missing `active_posts_count_public` — split into `active_posts_count_public_open` + `active_posts_count_followers_only_open` because FR-PROFILE-013 AC2 is viewer-dependent). Partially closes TD-20 (community_stats endpoint shape exists; activity timeline + nightly drift recompute job stay open under FR-STATS-003 / FR-STATS-005 application code). |
| AC verified | SQL static review only. End-to-end verification deferred to operator (probes below). |
| Known gaps | (a) FR-STATS-003 activity timeline ships at the application layer (read-side projection over posts/recipients events) — not in this slice. (b) FR-STATS-005 nightly `bg-job-stats-recompute` is the durable equivalent of the on-write triggers; the Edge Function ships in P1.6. The schema seam is the `stats_safe_dec` NOTICE log, which an operator can scrape for `stats_drift_detected`. (c) FR-CLOSURE-008's actual `bg-job-soft-delete-cleanup` Edge Function is not in this slice — only the supporting partial index ships here. (d) Hard-delete of a `closed_delivered` post does NOT roll back `items_given_count` (FR-STATS-005 reconciles drift). The legitimate path for `closed_delivered` is reopen → status trigger handles it. (e) `community_stats` is a regular view, not materialised; SRS FR-STATS-004 AC2's 60s freshness contract is fulfilled at the edge cache layer, not the DB. Promote to MV + pg_cron when scale warrants. (f) **`users` not added to `supabase_realtime` publication** — fixed in follow-up P0.2.f1 (above). FR-PROFILE-013 AC5 was unfulfilled at original P0.2.f land. (g) **Internal counter columns are SELECT-able by any authenticated viewer of a Public profile** (FR-PROFILE-013 AC4 system-level guarantee leaks at the schema). Logged as TD-39 — mitigation is application-layer discipline (read `active_posts_count_for_viewer()`, never the raw `_internal` column for non-owners). |
| Operator setup notes | `supabase db push`. Verify after applying 0001..0006: (1) `select * from public.community_stats;` returns one row with three integers + `as_of` timestamp. (2) As user A insert a `Public` open post — `select active_posts_count_internal, active_posts_count_public_open, posts_created_total from public.users where user_id = A;` must show 1, 1, 1. (3) Update its `visibility` to `OnlyMe` is forbidden by `posts_visibility_upgrade_check` (visibility is upgrade-only); update an `OnlyMe` post to `Public` and re-check — `public_open` must increment. (4) Delete the post — `active_posts_count_internal` and `active_posts_count_public_open` must decrement to 0; `posts_created_total` stays at 1 (lifetime counter). (5) `select public.active_posts_count_for_viewer(A, A);` returns the internal count; `select public.active_posts_count_for_viewer(A, null);` returns the anon-viewer (public-only) count. (6) Two users follow each other — `followers_count` and `following_count` of both must be 1. (7) `select public.stats_safe_dec(0);` returns 0 and emits a NOTICE in pg logs. After verification, regenerate `database.types.ts` and commit. |

---

### 🟡 P0.2.e — Moderation (migration written, awaiting operator apply)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-MOD-001 (report a target — 24h dedup, target reachability), FR-MOD-002 (issue report — `target_type='none'` row shape), FR-MOD-005 (auto-removal at 3 distinct reporters: post → `removed_admin`, user → `suspended_admin`, chat → `removed_at`), FR-MOD-008 (suspect queue with `excessive_reopens`, partial UNIQUE on open entries), FR-MOD-010 (false-report counter — column + increment trigger; sanction escalation deferred to admin tooling), FR-MOD-011 (reporter-side hides — auto-row on every report INSERT, filtered by `is_post_visible_to`), FR-MOD-012 (audit log on block/unblock, report, auto-remove, dismiss/confirm). Cross-references INV-C3 (Domain 3.5 — `posts.reopen_count >= 5` ⇒ queue entry). Closes the P0.2.d note about `kind='system'` messages by adding the `inject_system_message` SECURITY DEFINER RPC and wiring it into the report INSERT trigger (FR-MOD-001 AC4). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). After apply, regenerate `database.types.ts`. |
| Branch / commit | `feat/p0-2-e-moderation-schema` (this commit) |
| Files added | `supabase/migrations/0005_init_moderation.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md`, `docs/superpowers/plans/2026-05-07-p0-2-db-schema-rls.md` |
| Tech debt logged | TD-38 (below) — sanction escalation logic (7d → 30d → permanent per FR-MOD-010 AC2) is intentionally NOT triggered by the database; the `false_reports_count` column increments, but admin-tooling decides when to flip `account_status` to `suspended_for_false_reports` and stamp `account_status_until`. The trigger ground is laid (the column lives on `users` from this migration); the sliding-window decision lives at the application layer. |
| AC verified | SQL static review only. End-to-end verification deferred to operator (probes below). |
| Known gaps | (a) Sanction escalation tier logic — see TD-12. (b) Forbidden-keyword detection (FR-MOD-008 AC1 reason `forbidden_keyword`) is not wired by trigger here — it's the responsibility of a future content-moderation service that calls `insert into moderation_queue_entries`. The schema accepts the reason value. (c) Notifications to the target owner on auto-removal (FR-MOD-005 AC5 — Critical category) ship with FR-NOTIF later. (d) Restore action (`FR-ADMIN-002`) is not part of this slice — `restore_target` is in the audit `action` enum so the trigger can stamp it when admin tooling lands. |
| Operator setup notes | `supabase db push`. Verify after applying 0001..0005: (1) `select public.is_admin(null::uuid);` returns `false`. (2) As a regular user A, `insert into public.reports (reporter_id, target_type, target_id, reason) values (A, 'post', '<post>', 'Spam');` succeeds; immediately a row appears in `public.reporter_hides` and another in `public.audit_events` (`action='report_target'`). (3) Re-running the same INSERT within 24h must error `duplicate_report`. (4) Two more distinct reporters reporting the same post must transition `posts.status` to `removed_admin` and write an `auto_remove_target` audit row. (5) After bumping a `posts.reopen_count` to 5, a queue row appears with `reason='excessive_reopens'`. After verification, regenerate `database.types.ts` and commit. |

---

### 🟡 P0.2.d — Chat & Messaging (migration written, awaiting operator apply)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-CHAT-001 (inbox), FR-CHAT-002 (conversation, 2,000-char cap), FR-CHAT-003 (send + pending/delivered/read state machine), FR-CHAT-004 (anchor first-wins, one chat per pair), FR-CHAT-005 (auto-message — no special row type), FR-CHAT-006 (open from profile, anchor null), FR-CHAT-007 (support thread auto-flag via super-admin participant), FR-CHAT-009 (block carve-out: blocker hides chat; blocked still sees, messages stay pending), FR-CHAT-011 (read-receipt server-side transitions), FR-CHAT-012 (unread badge — partial index `messages_chat_unread_idx`), FR-CHAT-013 (sender_id ON DELETE SET NULL preserves message body for the counterpart). Cross-references FR-MOD-009 (chat dimension carved out per FR-CHAT-009 AC1). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). After apply, regenerate `database.types.ts`. Realtime publication add-table is gated by `if exists pg_publication`, so the migration is safe on local without breaking production. |
| Branch / commit | `feat/p0-2-d-chat-messaging` (this commit) |
| Files added | `supabase/migrations/0004_init_chat_messaging.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md`, `docs/superpowers/plans/2026-05-07-p0-2-db-schema-rls.md` |
| Tech debt logged | None new. Adds two new SECURITY DEFINER helpers (`has_blocked` directional, `is_chat_visible_to`) — same auditing posture as `is_blocked`/`is_following` introduced in P0.2.c. |
| AC verified | SQL static review only. End-to-end verification deferred to operator (probes below). |
| Known gaps | (a) System messages (kind='system') currently have no client-facing INSERT path — they ship in P0.2.e via SECURITY DEFINER RPCs (`inject_system_message`) plus the FR-MOD-002 report-issue auto-inject. (b) Counter maintenance for `users.unread_messages_count` is not in the schema; clients compute the badge via `count(*) where status<>'read' and sender_id<>auth.uid()`. Wholesale unread denormalization is a P1.5 concern at most. (c) `Chat.anchor_history` (FR-CHAT-004 AC1 analytics-side) is intentionally not modelled — analytics events are emitted at the application layer instead. (d) FR-CHAT-013 AC3 90-day archive is post-MVP (V1.5+) and intentionally not modelled here. |
| Operator setup notes | `supabase db push`. Verify after applying 0001..0004: (1) `select public.has_blocked(null::uuid, null::uuid);` returns `false` (NULL-safe). (2) Insert two real users A, B; `insert into public.chats (participant_a, participant_b) values (B, A) returning participant_a, participant_b;` — must return `(A, B)` thanks to the canonicalize trigger. (3) `insert into public.messages (chat_id, sender_id, body) values ('<chat>', A, 'hello');` — must succeed and bump `chats.last_message_at`. (4) After A blocks B: re-running `select * from public.chats where chat_id = '<chat>'` as A returns 0 rows (RLS hides), but the same query as B still returns the row. (5) Send a Realtime subscribe from a client to `messages:chat_id=eq.<chat>` and verify events are delivered to the recipient only. After verification, regenerate `database.types.ts` and commit. |

---

### 🟡 P0.2.c — Following & Blocking (migration written, awaiting operator apply)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-FOLLOW-001 (instant edge on Public), FR-FOLLOW-002 (unfollow), FR-FOLLOW-003 (request to Private), FR-FOLLOW-004 (cancel), FR-FOLLOW-005 (approve → edge), FR-FOLLOW-006 (reject + 14-day cooldown), FR-FOLLOW-008 (re-follow after cooldown), FR-FOLLOW-009 (remove follower — followed-side delete), FR-FOLLOW-012 (FollowersOnly visibility now wired in `is_post_visible_to`), FR-MOD-003 (block + cascading side effects), FR-MOD-004 (unblock — application layer; row deletion is a simple DELETE under RLS), FR-MOD-009 (bilateral filtering at the data layer), FR-PROFILE-003 (approved-follower expansion of Private SELECT). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). After apply, regenerate `database.types.ts`. |
| Branch / commit | `feat/p0-2-c-following-blocking` (this commit) |
| Files added | `supabase/migrations/0003_init_following_blocking.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt logged | None new. Closes the P0.2.b placeholder in `is_post_visible_to` (FollowersOnly was returning `false` for non-owners; now resolves through `is_following()`). Adds the block short-circuit that was deferred from P0.2.b. |
| AC verified | SQL static review only. End-to-end verification deferred to operator (sketch in `Operator setup notes` below). |
| Known gaps | (a) Counter maintenance for `users.followers_count` / `users.following_count` ships in P0.2.f. Until then, app reads can use `count(*)` from `follow_edges`. (b) Notifications on follow / follow-request / approval (FR-NOTIF-006/007/008) ship later — the data shape exists; the push layer does not. (c) Chat-side filtering of blocked pairs is referenced by FR-MOD-003 AC4 but lives in P0.2.d (chats table not yet present). (d) `is_blocked` and `is_following` are SECURITY DEFINER functions that bypass RLS by design — auditors should know this is intentional (the visibility predicates need to read both directions of `blocks` and need to short-circuit the chicken-and-egg between users RLS and follow_edges RLS). |
| Operator setup notes | `supabase db push`. Verify with three quick SQL probes after applying both 0002 (if not yet applied) and 0003: (1) `select public.is_blocked('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);` returns `false` (NULL-safe). (2) After two real users A and B exist, run `insert into public.follow_edges(follower_id, followed_id) values ('A','A');` — must error `self_follow_forbidden`. (3) `insert into public.blocks(blocker_id, blocked_id) values ('A','B'); insert into public.follow_edges(follower_id, followed_id) values ('A','B');` — second statement must error `blocked_relationship`. After verification, regenerate `database.types.ts` (`supabase gen types typescript --project-id <id> > app/packages/infrastructure-supabase/src/database.types.ts`) and commit. |

---

### 🟡 P0.2.b — Posts core (migration written, awaiting operator apply)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-POST-001..020 (post lifecycle, fields, visibility, edit/delete, image cap, active-post cap), FR-FEED-001..002 (feed visibility predicate is the same function), FR-CLOSURE-002..003 (recipient row shape; the closure flow itself ships later), FR-POST-017 (recipient view path through `is_post_visible_to`). |
| PRD anchor | N/A — infrastructure |
| Status | 🟡 SQL written, reviewed, committed. **Operator must apply** (`supabase db push`). After apply, regenerate `database.types.ts`. |
| Branch / commit | `feat/p0-2-db-schema-rls` |
| Files added | `supabase/migrations/0002_init_posts.sql` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt logged | TD-11 (below) — storage bucket is currently public; for `OnlyMe`/`FollowersOnly` posts we rely on URL non-discoverability. Tighten to per-post signed URLs when relevant scale arrives. |
| AC verified | SQL static review only. End-to-end verification deferred to operator. |
| Known gaps | (a) `is_post_visible_to()` returns `false` for non-owner viewers of `FollowersOnly` posts — this is the deliberate placeholder until P0.2.c lands `follow_edges`. (b) Block-aware Public visibility also deferred to P0.2.c. (c) Counter-trigger maintenance for `users.active_posts_count_internal` ships in P0.2.f. |
| Operator setup notes | `supabase db push`. Verify by signing in as the test user, manually inserting a row through the Supabase SQL editor: `insert into posts (owner_id, type, title, city, street, street_number) values ('<your-user-id>','Give','Test couch','tel-aviv','Bialik','12');` then re-running the mobile app to see it surface in the feed (P0.4 will wire the real CRUD). |

---

### ✅ P0.2.a — Foundation & Identity (applied to live project)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-003 (Google sign-up bridge), FR-AUTH-006 (email sign-up bridge), FR-AUTH-010..012 (onboarding row exists), FR-PROFILE-001..007 (real `users` row), FR-PROFILE-013 (counter columns reserved) |
| PRD anchor | N/A — infrastructure |
| Completed | 2026-05-07 — operator ran `supabase db push` against the live project (Postgres 17). |
| Branch / commit | `feat/p0-2-db-schema-rls` (commit `1a04f0f`) |
| Files added | `supabase/config.toml`, `supabase/migrations/0001_init_users.sql`, `supabase/seed.sql`, `supabase/README.md`, `docs/superpowers/plans/2026-05-07-p0-2-db-schema-rls.md` |
| Files changed | `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt logged | TD-1 (database.types.ts) — partial close upcoming once types are regenerated. |
| AC verified | SQL static review only. End-to-end verification deferred to operator: (1) sign in with Google, (2) confirm a row appears in `public.users` with the Google name + avatar, (3) re-sign-in does not duplicate. |
| Known gaps | (a) Approved-follower expansion of `users` SELECT for `Private` rows ships in P0.2.c. (b) Counters are columns only — triggers that maintain them ship in P0.2.f. (c) `database.types.ts` still `any` until operator runs `supabase gen types`. |
| Operator setup notes | Run `supabase login` then `supabase link --project-ref <ref>` once. Then `supabase db push` to apply this migration. Regenerate types with `supabase gen types typescript --project-id <ref> > app/packages/infrastructure-supabase/src/database.types.ts` and commit. |

---

### ✅ UX polish — Tab bar + Profile labels + Real Google identity on `AuthSession`

| Field | Value |
| ----- | ----- |
| Mapped to SRS | `FR-AUTH-003` AC5 (new), `FR-PROFILE-001` AC4 (label clarification) + AC6 (new), PRD `06_Navigation_Structure.md` §6.1.2 |
| PRD anchor | `05_Screen_UI_Mapping.md` §3.1, `06_Navigation_Structure.md` §6.1 |
| Completed | 2026-05-07 |
| Branch / commit | `feat/p0-2-db-schema-rls` (UX polish landing alongside in-progress P0.2 prep) |
| Files added | `docs/superpowers/specs/2026-05-07-tabs-profile-google-name-design.md` |
| Files changed | `app/packages/application/src/ports/IAuthService.ts` (added `displayName` + `avatarUrl`), `app/packages/application/src/auth/__tests__/fakeAuthService.ts` (helper picks up nulls), `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts` (`toSession` reads `user.user_metadata.full_name` / `name` / `avatar_url` / `picture`), `app/apps/mobile/app/(tabs)/_layout.tsx` (icon-only side tabs, white "+" when active), `app/apps/mobile/app/(tabs)/profile.tsx` (reads `useAuthStore().session`, renames tabs to "פוסטים פתוחים / פוסטים סגורים", counters → 0/0/0, drops `MOCK_USER`/`MOCK_POSTS` usage), `docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md`, `docs/SSOT/SRS/02_functional_requirements/02_profile_and_privacy.md`, `docs/SSOT/PRD_MVP_CORE_SSOT/06_Navigation_Structure.md` |
| Tech debt logged | TD-10 (below) |
| Tests | `app/packages/application`: vitest run → **19/19 passing** (no new tests; existing `makeSession` helper updated). Typecheck clean across application, infrastructure-supabase, and mobile (`tsc --noEmit` exit 0 in all three). |
| AC verified (logically) | FR-AUTH-003 AC5 (`AuthSession.displayName`/`avatarUrl` populated from Google `user_metadata`); FR-PROFILE-001 AC4 (Hebrew labels updated to "פוסטים פתוחים / פוסטים סגורים"); FR-PROFILE-001 AC6 (counters render 0 until P0.2). Manual end-to-end on simulator confirmed by user before this commit landed. |
| Known gaps | Email/password users have empty `user_metadata`; `displayName` falls back to email local-part then to "משתמש". Settings screen rows still mostly stubbed (P2.1 — out of scope for this change). The "Edit Profile" / "Share" buttons on the profile card remain inactive (P2.4). |

---

### ✅ FR-AUTH-003 / FR-AUTH-007 (Google path) — Google SSO sign-in & sign-up

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-003 (sign-up via Google), FR-AUTH-007 (sign-in, Google path), FR-AUTH-002 AC1 (button visible on Android/Web/iOS) |
| PRD anchor | `03_Core_Features.md` §3.1.1 |
| Completed | 2026-05-07 |
| Branch / commit | (current working tree) |
| Files added | `app/packages/application/src/auth/SignInWithGoogle.ts`, `app/packages/application/src/auth/__tests__/SignInWithGoogle.test.ts`, `app/apps/mobile/app/auth/callback.tsx` |
| Files changed | `app/packages/application/src/ports/IAuthService.ts` (added `getGoogleAuthUrl` + `exchangeCodeForSession`), `app/packages/application/src/index.ts`, `app/packages/application/src/auth/__tests__/fakeAuthService.ts`, `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts` (OAuth + code exchange), `app/packages/infrastructure-supabase/src/client.ts` (PKCE flow, web/native storage split), `app/packages/infrastructure-supabase/src/index.ts` (export `SupabaseAuthStorage`), `app/apps/mobile/src/services/authComposition.ts` (wires `WebBrowser` + `AuthSession`), `app/apps/mobile/app/(auth)/index.tsx` (live Google handler + spinner), `app/apps/mobile/app/_layout.tsx` (whitelist `/auth/callback` while unauthenticated) |
| Tech debt logged | NA |
| Tests | `app/packages/application`: vitest run → **19/19 passing** (3 new for Google use case); `pnpm -r exec tsc --noEmit` → clean |
| AC verified | FR-AUTH-002 AC1 (Google button rendered web/Android), FR-AUTH-003 AC1 (Supabase auto-creates User on first Google login + emits session), FR-AUTH-007 AC1 (existing Google user → silent re-sign-in, Supabase routes by `sub`); manual end-to-end on web preview confirmed by user (round-trip to Google + return with session) |
| Known gaps | Apple SSO (P3.2) and Phone OTP (P3.3) still placeholder; deep-link race for native cold-start with deferred OAuth callback (TD-3 already tracked); `getGoogleAuthUrl` could surface `provider_disabled` as a typed `AuthError.code` rather than `'unknown'` (minor) |
| Setup notes (operator-side) | Supabase Dashboard → Auth → Providers → Google: enable + Client ID + Client Secret. Auth → URL Configuration → Redirect URLs must include `http://localhost:8081/auth/callback` (web dev) and `karmacommunity://auth/callback` (native). Google Cloud OAuth client: Authorized redirect URI must include `https://<project>.supabase.co/auth/v1/callback`. |

---

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
| TD-12 | **Audit baseline 2026-05-07** — full review of code vs PRD/SRS produced 49 findings across P0/P1/P2/P3. See [`CODE_AUDIT_2026-05-07.md`](./CODE_AUDIT_2026-05-07.md). The TD rows below mirror that audit's individual items. | High | Audit 2026-05-07 | Open |
| TD-13 | No `IPostRepository` Supabase adapter — port declared, no implementation. Mock data still consumed by feed/create/post detail. (AUDIT-P0-01) | High | Audit 2026-05-07 | Open (P0.4) |
| TD-14 | No `IUserRepository` Supabase adapter; profile + user-detail screens use `MOCK_USER`. (AUDIT-P0-02) | High | Audit 2026-05-07 | Open (P0.4 / P2.4) |
| TD-15 | No `IChatRepository` Supabase adapter; chat list + thread use `MOCK_MESSAGES`. (AUDIT-P0-03) | High | Audit 2026-05-07 | Open (P0.5) |
| TD-16 | Chat schema (`chats`, `messages`, RLS, realtime triggers) not yet migrated — planned `P0.2.d`. (AUDIT-P0-04) | High | Audit 2026-05-07 | Open (P0.2.d) |
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
| TD-33 | No top-level `<ErrorBoundary>` in `app/_layout.tsx` — Supabase failures crash the app. (AUDIT-P2-10) | Med | Audit 2026-05-07 | Open |
| TD-34 | `CLAUDE.md` references `PRD_MVP_SSOT_/` (does not exist; correct path: `PRD_MVP_CORE_SSOT/`). `SRS.md:10` references `../../PRD_MVP/` (correct: `./PRD_MVP_CORE_SSOT/`). (AUDIT-P3-03 + AUDIT-P3-04) | Low | Audit 2026-05-07 | ✅ Resolved 2026-05-07 (paths fixed in this commit) |
| TD-35 | `i18n/he.ts` (207 LOC) violates `≤ 200 LOC` cap; split per domain. (AUDIT-P3-08) | Low | Audit 2026-05-07 | Open |
| TD-36 | `SRS/appendices/A_traceability_matrix.md` referenced as FR ↔ R-MVP ↔ Screen ↔ Test mapping — needs population audit. (AUDIT-P3-06) | Low | Audit 2026-05-07 | Open |
| TD-37 | Sprint Board §3 lists "P0.2 In progress" without indicating P0.2.d/e/f are unwritten — needs a refresh. (AUDIT-P3-05) | Low | Audit 2026-05-07 | Open |
| TD-38 | FR-MOD-010 sanction escalation (7d → 30d → permanent) is **schema only** in P0.2.e: `users.false_reports_count` increments via the report-status trigger, but the actual transition to `suspended_for_false_reports` and the stamping of `account_status_until` are **not** triggered by the DB. Reason: the rule is a 30-day sliding-window count of dismissed reports — the count, the window, and the tier escalation are admin-tooling decisions that should live with `FR-ADMIN-*` flow code (not in a generic trigger). Schema columns (`false_reports_count`, `false_report_sanction_count`, `account_status_until`) are reserved on `users` so the application can flip them when the admin slice lands. | Med | P0.2.e 2026-05-07 | Open |
| TD-39 | **Internal counter columns leak to non-owner viewers of Public profiles.** 0001's `users_select_public` policy + the row-level grant let any authenticated client read `active_posts_count_internal`, `items_given_count`, `items_received_count`, `posts_created_total`, `false_reports_count`, etc. on Public+active profiles. A non-owner can compute `internal − public_open − followers_only_open` to infer the existence of `OnlyMe` posts, violating FR-PROFILE-013 AC4's "**never** reveals" system-level guarantee, and FR-STATS-006 AC1's "stats screen never exposes data about other users" intent. Schema-level fix is awkward (Postgres column-grants apply per role *before* RLS, so revoking the grant from `authenticated` would also break the owner's own self-read). The correct fix is application-layer: the `IUserRepository` Supabase adapter (planned P2.4) MUST call `active_posts_count_for_viewer(owner, viewer)` for non-self reads and never project the raw `_internal` counter into Other-Profile responses. Add a lint/test to prevent regressions when the adapter is written. Schema-level reinforcement (a `users_public` view + revoke direct SELECT) is a possible future hardening but not blocking. | Med | P0.2.f1 audit 2026-05-07 | Open |
| TD-40 | `SupabaseUserRepository` is a P0.3.a slice stub — only `getOnboardingState`, `setBasicInfo`, `setOnboardingState` are wired against `public.users`. The remaining 19 `IUserRepository` methods throw `not_implemented` and must be filled in during P0.4 (`findByAuthIdentity`, `findById`), P1.1 (follows + follow-requests), P1.4 (blocks), P2.4 (`update`, `findByHandle`, `delete`). Adapter file: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`. The `not_implemented` errors include the slice that owns each method so callers know where to look. | Med | P0.3.a 2026-05-07 | Open |

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
