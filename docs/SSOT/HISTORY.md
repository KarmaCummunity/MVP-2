# Completed Features Log — Karma Community MVP

Append-only history. **Newest at top.** Compact bullet format: SRS IDs · branch/PR · tests · tech-debt deltas · open gaps. No file lists (use git). No operator steps (use [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md)).

> Live execution state lives in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). Active tech debt lives in [`TECH_DEBT.md`](./TECH_DEBT.md). This file is the historical record.

---

### 🟢 P0.3.b — FR-AUTH-011 onboarding photo upload (camera + gallery + Storage)
- **SRS**: FR-AUTH-011 AC1 (camera + gallery), AC2 (resize 1024 + JPEG q=0.85), AC3 (skip → silhouette via `AvatarInitials`), AC4 (SSO-prefilled, replaceable, removable), AC5 (errors recoverable — Alert + Skip remains available)
- **Branch**: `feat/FR-AUTH-011-onboarding-photo` · 2026-05-08
- **Tests**: 57 vitest passing (5 new in `auth/SetAvatarUseCase`) · tsc clean (5 packages) · `pnpm lint:arch` 105 files passing
- **Tech debt closed**: TD-22 (P0.3 onboarding wizard fully done — slices A + B + C); also closes the FR-AUTH-011 piece of TD-22 entirely
- **Tech debt partially closed**: TD-40 (`SupabaseUserRepository.setAvatar` wired — 18 stubs remaining)
- **New migration**: `0009_init_avatars_bucket.sql` — `avatars` Storage bucket (public-read, owner-folder RLS, 512KB cap, image/jpeg only). Same posture as `post-images`; both tracked under TD-11 for pre-launch tightening to signed URLs.
- **Open gaps**: Camera capture is mobile-only (web users get gallery-only — `isCameraAvailable === false`). Server-side EXIF Edge Function still pending (TD-23). FR-PROFILE-007 Edit Profile photo replace will reuse `SetAvatarUseCase` + `pickAvatarImage` + `resizeAndUploadAvatar` when P2.4 lands.

---

### 🟢 P0.4-FE — Feed UI + Create form (mock retirement + image upload)
- **SRS**: FR-POST-001..006, FR-POST-008 (read-side via UpdatePostUseCase use-case ready), FR-POST-010, FR-POST-014, FR-POST-015, FR-FEED-001..005, FR-FEED-013, FR-PROFILE-001 (partial), FR-AUTH-014 (partial — guest feed now live)
- **Branch**: `feat/FR-POST-001-fe-feed-create` · 2026-05-08 · PR #14
- **Tests**: 52 vitest passing (27 new in `posts/*` + `feed/GetFeedUseCase` — FakePostRepository + 5 use-case suites); tsc clean (5 packages); `pnpm lint:arch` 102 files passing
- **Tech debt closed**: TD-13 (full — read/create/update/delete adapter consumers wired; close/reopen still `not_implemented('P0.6')` per scope), TD-32 (post/[id] silent fallback → not-found state), AUDIT-P0-01, AUDIT-P0-11 (image picker + resize + upload), AUDIT-P2-02 + TD-5 (mock/data.ts deleted)
- **Tech debt partially closed**: TD-23 (image upload + client-side EXIF strip via re-encode shipped; **server-side EXIF Edge Function still pending — AUDIT-X-03**), TD-29 (`(tabs)/index.tsx` 136 LOC, `(tabs)/profile.tsx` 214, `post/[id].tsx` 165, `(tabs)/create.tsx` ~250 — under or near cap; allowlist mostly-respected), TD-42 (active-posts counter wired via `countOpenByUser`; followers/following/items_given/items_received still `0` pending TD-40 / P2.4)
- **Open gaps**: FR-POST-006 AC2/AC3 visibility interstitials · FR-POST-007 local draft autosave · FR-POST-008 image-edit (depends on BE update() mediaAssets) · FR-FEED-006..015 (P1.2 / TD-26) · FollowersOnly visibility option in create form (TD-40 / P2.4) · TD-41 SQL probes for SECURITY DEFINER predicates (Public path only exercised here)

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
