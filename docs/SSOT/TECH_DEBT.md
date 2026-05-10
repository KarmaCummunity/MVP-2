# Tech Debt Log — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-10 (FR-CHAT-002 web fixes — TD-118 partially closed: chat/[id].tsx now 194 LOC, allowlist entry removed; chatStore.ts (232) still allowlisted.) |
| **How agents use this** | Before opening a PR, scan the area you're touching. Closing adjacent debt in the same PR is encouraged when scope is small. |

> Live execution state lives in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). Historical feature log lives in [`HISTORY.md`](./HISTORY.md). This file is the active debt register.

**Severity**: 🔴 High · 🟠 Med · 🟢 Low
**ID lanes**: BE = `TD-50..99` · FE = `TD-100..149` (legacy IDs `TD-1..43` predate the lane split — keep as-is)

---

## Active

### Backend & data (domain · application · infrastructure-supabase · supabase/)

| ID | Sev | Item | Closing slice |
| -- | -- | ---- | ------- |
| TD-2 | 🟠 | FR-AUTH-006 AC1 breached-passwords check not implemented (Supabase doesn't expose HIBP OOTB; needs API integration) | P2.x hardening |
| TD-6 | 🟠 | `packages/infrastructure-supabase/src/client.ts` has pre-existing TS errors: (a) `ConstructorParameters<typeof createClient>[2]` generic constraint mismatch with `@supabase/supabase-js@2.69`, (b) `process.env` references without `@types/node`. Tighten the storage adapter typing and add `@types/node` as a dev dep on the infra package | Opportunistic |
| TD-15 | 🔴 | No `IChatRepository` Supabase adapter; chat list + thread use `MOCK_MESSAGES` | P0.5 |
| TD-17 | 🔴 | Closure flow (mark delivered / un-mark / reopen / educational popup) entirely absent — North Star metric unmeasurable | P0.6 |
| TD-19 | 🔴 | Push notifications: no device lifecycle, no fan-out, no preferences table | P1.5 |
| TD-20 | 🔴 | Statistics: counters render `0`; no `bg-job-stats-recompute`; no community-stats endpoint; no activity timeline | P1.6 |
| TD-23 | 🟠 | Server-side EXIF strip Edge Function pending (client-side strip via re-encode shipped in P0.4-FE). Author Edge Function under `supabase/functions/` | Follow-up to P0.4-FE |
| TD-38 | 🟠 | FR-MOD-010 sanction escalation (7d→30d→permanent) is schema-only in P0.2.e; escalation logic should live with `FR-ADMIN-*` flow code (30-day sliding-window count, tier transitions, stamping `account_status_until`). Reserved columns: `false_reports_count`, `false_report_sanction_count`, `account_status_until` | P2.5 (super-admin) |
| TD-39 | 🟠 | **Internal counter columns leak to non-owner viewers of Public profiles.** RLS allows authenticated clients to read `active_posts_count_internal`, `items_given_count`, `items_received_count`, `posts_created_total`, `false_reports_count` on Public+active profiles. A non-owner can compute `internal − public_open − followers_only_open` to infer `OnlyMe` post existence, violating FR-PROFILE-013 AC4 and FR-STATS-006 AC1. Schema-level fix is awkward (Postgres column-grants apply per role *before* RLS). **Application-layer fix**: `IUserRepository` Supabase adapter MUST call `active_posts_count_for_viewer(owner, viewer)` for non-self reads and never project raw `_internal` into Other-Profile responses. Add lint/test on adapter. | P2.4 (or P0.4-FE follow-up) |
| TD-40 | 🟠 | **PARTIAL** — `SupabaseUserRepository` is a slice stub. Wired: `getOnboardingState`, `setBasicInfo`, `setOnboardingState`, `setAvatar` (P0.3.b 2026-05-08). `findByHandle` shipped in P0.5; the `/user/[handle]` screen is now real (avatar, name, handle, bio, Send-message + Block CTAs). Remaining: counters (followers/following/items_given/items_received), full profile sections, posts list. Other `not_implemented` methods include the slice that owns each. Adapter: `packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`. | P0.4 (`findByAuthIdentity`, `findById`) · P1.1 (follows + follow-requests) · P1.4 (blocks) · P2.4 (`update`, `delete`, remaining counters) |
| TD-41 | 🟠 | `is_blocked()` and `is_following()` are `SECURITY DEFINER` functions that bypass RLS (intentional — visibility predicates need to read both directions). A predicate defect would silently break the privacy contract with no RLS error. **Mitigation**: SQL probes (vitest under `@kc/infrastructure-supabase`) covering: (a) `is_blocked(A,B)` true when A blocks B; (b) `is_following(A,B)` honors `accepted` follows but not `pending`; (c) `is_post_visible_to()` short-circuits on either side of a block | When P1.1 / P0.5 first exercises FollowersOnly + chat block paths |
| TD-50 | 🟠 | `SupabasePostRepository` and `SupabaseAuthService` have no adapter-level tests (only `pnpm typecheck` + downstream use-case fakes guard them). Pure helpers (`mapPostRow`, `cursor.ts`, `mapAuthError`) deserve unit tests. Adding vitest to `@kc/infrastructure-supabase` is a small focused slice | Opportunistic |
| TD-52 | 🟠 | **`admin_restore_post` RPC + UI for FR-ADMIN-002 (partial).** The admin remove flow (FR-ADMIN-009, migration 0020) flips status to `removed_admin` and writes a `manual_remove_target` audit row. There is no symmetric restore yet — the only path to restore is a manual SQL `UPDATE posts SET status = 'open' WHERE post_id = ...`. Build a `SECURITY DEFINER` RPC that flips `removed_admin → open`, writes `restore_target` to `audit_events`, and surfaces it from a future audit-log UI (FR-ADMIN-007). | P2.5 |
| TD-116 | 🔴 | **Full report processing pipeline absent.** 24h dedup trigger on `reports`, auto-removal trigger, false-report sanctions counter — required by FR-MOD-001 AC5/AC7, FR-MOD-004, FR-MOD-008. The report-issue screen exists (P0.5) but inserts a raw `reports` row only; no downstream automation fires. | P1.3 |
| TD-117 | 🔴 | **Report-summary system message on support thread not injected.** Required by FR-CHAT-007 AC3 (the inject) and FR-MOD-002 (the formatting). Currently the support thread opens cleanly via `GetSupportThreadUseCase` but the report-issue flow does NOT inject any system message describing the reported issue. | P1.3 |

### Mobile & UI (apps/mobile · packages/ui)

| ID | Sev | Item | Closing slice |
| -- | -- | ---- | ------- |
| TD-3 | 🟠 | FR-AUTH-013 AC1 races with deep-links: cold-start session check happens before deep-link routing; needs `expo-router` redirect-with-state pattern | Opportunistic |
| TD-5 | 🟠 | (Originally: `mock/data.ts` consumed by ~5 screens). File deleted in P0.4-FE; remaining screens now consume real repositories. **Residue**: chat list + thread still consume local `MOCK_MESSAGES` inline — closes with TD-15 | P0.5 |
| TD-8 | 🟠 | Mobile typecheck shows duplicate-identifier errors in `lib.dom.d.ts` (`URLSearchParams`, `RequestInfo`, `XMLHttpRequestResponseType`) due to React Native + DOM type collision. Cascades into false "Promise constructor not found" errors. Fix by adjusting `tsconfig.json` `lib` to drop `DOM` or upgrading `@types/react-native` typings | Opportunistic |
| TD-10 | 🟢 | ~~`AuthSession.displayName`/`avatarUrl` are an interim source for "My Profile" header (FR-AUTH-003 AC5).~~ Closed 2026-05-10: `(tabs)/profile.tsx` now reads `User` via `IUserRepository.findById`; session fields are first-render fallback only while the query is in flight. | Closed 2026-05-10 |
| TD-14 | 🔴 | No `IUserRepository` Supabase adapter usage in profile + user-detail screens (`MOCK_USER` retired but `findByHandle`/`findById` still throw). Profile counter cards still render `0` for everything except active-posts | P2.4 (Other Profile) — P0.4-FE wired My Profile partial |
| TD-18 | 🔴 | Reports + block/unblock + auto-removal + false-report sanctions UI absent | P1.3 + P1.4 |
| TD-24 | 🔴 | Apple SSO + Phone OTP buttons placeholder — required for iOS App Store + Israeli SMS path | P3.2 / P3.3 |
| TD-25 | 🔴 | No "Follow Requests" UI (screen 5.4); private profile not functional client-side | P1.1 |
| TD-26 | 🔴 | Free-text search, filter persistence, cold-start fallback, first-post nudge, community counter, realtime feed all absent | P1.2 |
| TD-27 | 🔴 | Auto-message in chat from post + read-receipt persistence absent | P0.5 |
| TD-28 | 🔴 | Bio URL filter, Edit Profile screen, privacy toggle, upgrade-only enforcement on Edit Post all missing | P2.4 |
| TD-29 | 🟠 | `pnpm lint:arch` enforces `≤ 200 LOC` cap. `(tabs)/index.tsx` (136), `(tabs)/profile.tsx` (214 — allowlisted), `post/[id].tsx` (165), `_layout.tsx` (108 — was 265, dropped from allowlist 2026-05-08 via AuthGate / BackButton / TabBar extraction) under cap. `(tabs)/create.tsx` ~250 — over cap, allowlisted; `useReducer` extraction tracked as future polish. `settings.tsx` 228 (allowlist 232 — onboarding-reset web fix added a few lines). `packages/domain/src/entities.ts` 214 (allowlist 214 — bumped from 205 in P0.5 to make room for `ReportSubmission` interface) | Opportunistic — (tabs)/create.tsx during P0.6 closure work |
| TD-35 | 🟢 | `i18n/he.ts` (207 LOC) violates `≤ 200 LOC` cap; split per domain | Opportunistic |
| TD-42 | 🟢 | ~~Counter cards in `apps/mobile/app/(tabs)/profile.tsx` — followers/following/items_given/items_received still render `0`.~~ Closed 2026-05-10: `(tabs)/profile.tsx` now reads the full `User` via `IUserRepository.findById`; followers/following counters wired to `User.{followersCount,followingCount}` and biography rendered in the header per FR-PROFILE-001 AC1. `items_given_count`/`items_received_count` are visible only on the Other-Profile screen (FR-PROFILE-002 / TD-14), not here. **Watch FR-PROFILE-013 / TD-39**: non-owner viewers must read via `active_posts_count_for_viewer()`, never raw `_internal` (still applies to TD-14). | Closed 2026-05-10 |
| TD-102 | 🟠 | **FR-AUTH-014 AC3 + FR-FEED-014 — guest overlay count hardcoded.** `i18n/he.ts` `feed.guestBanner` says `"50+ פוסטים פעילים"` literally. Spec requires parameterized count from `community_stats.active_public_posts_count` (already exists per migration 0006). Read once on guest-feed mount + interpolate | Opportunistic |
| TD-106 | 🟠 | ~~**FR-PROFILE-001 — Edit Profile + Share buttons dead.**~~ Edit Profile button now navigates to `app/edit-profile.tsx` (FR-PROFILE-007 partial — name + city + biography + avatar editable; persists via `UpdateProfileUseCase`). Share button still no-op (deferred — needs deep-link generator). | Closed 2026-05-09 (Edit Profile portion); Share row remains a P2.4 nit |
| TD-107 | 🟠 | **Settings screen — 7 dead rows + dangerous silent Delete account.** `app/settings.tsx` has `onPress={() => {}}` on lines 99, 132, 133, 139, 145, 146, 147, 175. The destructive-styled "מחק חשבון" (line 175) silently no-ops — confusing for a "permanent" action. Show "בקרוב" alerts until each row's owning slice ships (P1.x / P2.2 / P2.4) | Opportunistic |
| TD-108 | 🟢 | **FR-AUTH-011 AC4 — avatar removal leaks Storage object.** `app/(onboarding)/photo.tsx:47-60` clears `users.avatar_url = null` but never deletes `avatars/<userId>/avatar.jpg`. ~50KB leak per remove (not a privacy issue — RLS still owns the path). Call `client.storage.from('avatars').remove([path])` before persisting null | Opportunistic |
| TD-114 | 🟠 | **Donations · Time → support thread wire-up.** **P0.5 ready** — `OpenOrCreateChatUseCase` + `GetSupportThreadUseCase` + the `/chat/[id]` route now exist. Wire-up in `app/(tabs)/donations/time.tsx`'s volunteer composer to navigate to the support thread is a separate post-P0.5 PR. | Post-P0.5 follow-up |
| TD-115 | 🔴 | **Push notifications wiring for chat absent.** Required by FR-CHAT-003 AC4. Depends on FR-NOTIF-001..006 (P1.5). Currently messages send + receive via Realtime, but no push is delivered when the app is backgrounded. | P1.5 |
| TD-118 | 🟠 | **Chat store still over 200-line cap.** `apps/mobile/src/store/chatStore.ts` (232) remains allowlisted; the screen side closed 2026-05-10 by extracting `useChatInit`/`useAnchorMissing` hooks + `<ChatActionMenu>` (chat/[id].tsx now 194). Remaining split path: split the store into `chatStoreInbox.ts` + `chatStoreThread.ts` slices. **Partial.** | Opportunistic |
| TD-119 | 🟠 | **Notify recipient on mark.** FR-CLOSURE-006 — Critical-category notification ("[Owner] סימן אותך כמקבל של [post]") is not delivered when a recipient is marked. Currently the recipient sees the mark passively when they next view the post. Depends on FR-NOTIF-001..006 (P1.5). | P1.5 |
| TD-120 | 🟠 | **Recipient un-marks self.** FR-CLOSURE-007 — recipient cannot remove their own credit. UI absent; use case absent; FR-NOTIF-013 (notify owner on un-mark) also depends on push. | P2.x |
| TD-121 | 🟠 | **Suspect flag at 5+ reopens.** FR-CLOSURE-010 — `posts.reopen_count` is incremented on every reopen (via 0015 RPC), but no moderation queue entry is created when the count reaches 5. Depends on FR-MOD-008 (P1.3). | P1.3 |
| TD-122 | 🟠 | **Storage orphan reconciliation for closure cleanup.** When `closure_cleanup_expired` (cron in 0016) hard-deletes a `deleted_no_recipient` post, the FK cascade removes `media_assets` rows but the actual blobs in the `post-images` bucket are not deleted. Build a daily reconciliation Edge Function that lists bucket contents and removes objects whose owning post no longer exists. | Maintenance |
| TD-123 | 🟢 | **Closure telemetry events.** FR-CLOSURE-002 AC3 specifies `closure_step1_completed`; the FR analytics map mentions further closure events. No telemetry infra exists in the repo yet. Defer until analytics pipeline lands. | Analytics |
| TD-124 | 🟠 | **⋮ overflow menu on feed-card.** FR-POST-010 AC1 mandates the menu both on the post detail screen (shipped 2026-05-10 via FR-ADMIN-009) and on the post card in the feed. Card-side menu is not yet implemented — feed cards have no destructive actions. Replicate `PostMenuButton`/`PostMenuSheet` placement at the card level. | Opportunistic |
| TD-125 | 🟠 | **"Edit" item missing from owner ⋮ menu.** FR-POST-015 AC1 lists Edit alongside Delete. The post-detail ⋮ menu (shipped 2026-05-10) only renders Delete because no edit-post screen exists (`UpdatePostUseCase` exists in `@kc/application` but no consuming UI). Building it requires `app/edit-post/[id].tsx` reusing the create form for FR-POST-008. | P2.x |
| TD-126 | 🟠 | **`removed_admin` posts invisible to their owner.** When the super admin removes a post via FR-ADMIN-009, RLS hides it from all viewers including the owner, and `getMyPosts` is called only with `['open']` or `['closed_delivered','deleted_no_recipient']`. The owner sees the post simply vanish with no explanation. Add `removed_admin` to a third tab in My Posts ("הוסרו") with a "removed by admin" banner per FR-POST-008 edge case. Affects FE (My Posts tab) and BE (`getMyPosts` status filter usage) — likely just FE since the status array is constructed client-side. | When admin moderation lands |
| TD-127 | 🟠 | **Parallel `getDeletePostUseCase()` in `postsComposition.ts` is now unused.** FR-ADMIN-009 added `container.deletePost` (consumed by `PostMenuSheet`). The earlier `getDeletePostUseCase()` factory in `app/apps/mobile/src/services/postsComposition.ts` has no remaining callers and creates a second `SupabasePostRepository` pointing at the same client. Remove the factory + composition state in a follow-up. | Opportunistic |
| TD-128 | 🟠 | **Search-mechanism files exceed 200-LOC cap.** `packages/infrastructure-supabase/src/search/SupabaseSearchRepository.ts` (418), `apps/mobile/app/(tabs)/search.tsx` (646), `apps/mobile/src/components/SearchFilterSheet.tsx` (306), `apps/mobile/src/components/SearchResultCard.tsx` (354). Landed on main from the search-mechanism PR stack (`e115b4c add search mechanism`); allow-listed in `app/scripts/check-architecture.mjs` so unrelated PRs (e.g. FR-ADMIN-009) can land. Split each file into smaller focused modules (data layer / filters / row components) and remove the allowlist entries. | Opportunistic (FR-FEED-006..014 / P1.2) |

### Process · docs · tooling

| ID | Sev | Item | Closing slice |
| -- | -- | ---- | ------- |
| TD-4 | 🔴 | `docs/SSOT/CODE_QUALITY.md` referenced from SRS.md but does not exist. Author with: layer responsibilities, file-size cap policy, error mapping table, testing strategy, ADR template | Opportunistic — partly served by `srs-architecture.mdc` + this file |
| TD-9 | 🟢 | `android/` is gitignored (CNG workflow). Must run `expo run:android` with `JAVA_HOME=.../temurin-17.jdk`. Pinned in `package.json android` script. If CI added, set `JAVA_HOME` env var there too | When CI lands |
| TD-11 | 🟢 | `post-images` storage bucket is public-read. For `OnlyMe`/`FollowersOnly` posts we rely on URL non-discoverability (post row hidden by RLS, image paths not enumerable). Replace with per-object signed URLs (or private bucket + sign-on-fetch) at scale | Pre-launch hardening |
| TD-30 | 🟠 | No JSDoc / TSDoc on most public exports across `domain`, `application`, `infrastructure`, mobile components | Opportunistic |
| TD-31 | 🟠 | Test coverage limited; no tests for repos, components, infra adapters, or invariants beyond use-cases | Opportunistic |
| TD-36 | 🟢 | `SRS/appendices/A_traceability_matrix.md` referenced as FR ↔ R-MVP ↔ Screen ↔ Test mapping — needs population audit | Opportunistic |
| TD-43 | 🟢 | `docs/SSOT/SRS.md` Last-Updated header still shows `2026-05-05`, but ACs were added on 2026-05-07 (FR-AUTH-003 AC5 — Google identity on AuthSession; FR-PROFILE-001 AC4 + AC6 — avatar/displayName fallback). One-minute fix | Opportunistic |

---

## Resolved (last 90 days, kept for cross-reference)

| ID | Item | Resolved |
| -- | -- | -- |
| TD-1 | `database.types.ts` was a stub — Audit confirmed it's 325 LOC of real generated types | 2026-05-07 |
| TD-7 | `apps/mobile/app/(auth)/index.tsx` and `apps/mobile/app/(tabs)/create.tsx` used `'/(tabs)/'` (trailing slash) violating `expo-router` typed-routes mode | 2026-05-06 (lint cleanup) |
| TD-12 | Audit baseline 2026-05-07 — 49 findings → all tracked as TD-13..TD-44 | 2026-05-08 (every finding has a live owner) |
| TD-13 | No `IPostRepository` Supabase adapter | 2026-05-08 (P0.4-BE adapter + P0.4-FE wiring; close/reopen reserved for P0.6) |
| TD-16 | Chat schema (`chats`, `messages`, RLS, realtime triggers) not migrated | P0.2.d applied |
| TD-21 | Counter triggers (`followers_count`, etc.) not written | 2026-05-07 (P0.2.f — `0006_init_stats_counters.sql`; viewer-aware total via `active_posts_count_for_viewer(owner, viewer)`) |
| TD-32 | `app/post/[id].tsx` fell back to `MOCK_POSTS[0]` on unknown ID — silent wrong-post display | 2026-05-08 (P0.4-FE — renders not-found `EmptyState`) |
| TD-33 | No top-level `<ErrorBoundary>` in `app/_layout.tsx` | 2026-05-08 (`ErrorBoundary.tsx` wraps root inside `SafeAreaProvider`; Hebrew fallback + retry; dev-only message detail) |
| TD-34 | `CLAUDE.md` referenced `PRD_MVP_SSOT_/`; `SRS.md:10` referenced `../../PRD_MVP/` | 2026-05-07 (paths fixed) |
| TD-37 | Sprint Board listed "P0.2 In progress" without indicating P0.2.d/e/f are unwritten | 2026-05-07 (sprint board updated; all migrations applied) |
| TD-51 | Domain code used raw `throw new Error(...)` in `value-objects.ts:112-113` | 2026-05-08 (`packages/domain/src/errors.ts` introduces `DomainError` + `ValidationError`; allowlist in `check-architecture.mjs` is empty — any future raw `throw new Error` in domain fails CI immediately) |
| TD-22 | Onboarding wizard slices A + B + C all shipped (basic info + photo upload + tour + soft-gate) | 2026-05-08 (P0.3.b — `(onboarding)/photo.tsx` wired to `pickAvatarImage` + `resizeAndUploadAvatar` + `SetAvatarUseCase`; migration `0009_init_avatars_bucket.sql`; supports camera+gallery on mobile, gallery-only on web) |
| TD-109 | Emoji literals (🏠 / 👤 / 📭 / 📦 / 🔍 / 🔎 / 💬 / 👤) used as icon glyphs in TabBar + (tabs)/_layout + EmptyState rendered as `?` tofu boxes on iOS 26 simulator (Apple Color Emoji glyph cache). | 2026-05-09 (replaced with `@expo/vector-icons` Ionicons across all sites; `EmptyState` API now takes `icon: keyof typeof Ionicons.glyphMap`. Type-checked; works cross-platform without depending on the system emoji font) |
| TD-110 | iOS native build at `~/Library/Developer/CoreSimulator/.../app.app/` was generated **before** `app.json` got `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription`. iOS terminates the app the moment `expo-image-picker` requests gallery / camera access without these strings — exact symptom: gallery picker → app dies with `NSPhotoLibraryUsageException`. Bundle ID was also stuck on `org.name.app` (Xcode default placeholder) instead of `com.karmacommunity.app`. Permission UX in `avatarUpload.ts` + `imageUpload.ts` was also silent on denial. | 2026-05-09 (re-ran `expo prebuild --platform ios --clean` regenerating `ios/` with the proper Info.plist + bundle ID; `pickAvatarImage` / `pickPostImages` now check `canAskAgain` and surface an alert with a "פתח הגדרות" CTA via `Linking.openSettings()` on permanent denial) |
| TD-101 | **FR-POST-019 AC1 / FR-POST-002 AC3 — city was free text.** Replaced `<TextInput>` with `<CityPicker>` in `app/(tabs)/create.tsx`. Eliminates the FK violation (`posts.city → cities.city_id`) that was returning hard 400 on every publish (Give and Request). City state now flows as `{ id, name }` matching `basic-info.tsx` / `edit-profile.tsx`. | 2026-05-09 |
| TD-103 | **FR-POST-004 AC2 — Request couldn't attach images.** Dropped the `{isGive && ...}` guard around `<PhotoPicker>`; `required={isGive}` keeps the asterisk and use-case validation only on Give. Request can now attach 0–5 optional images. | 2026-05-09 |
| TD-104 | **FR-POST-003 AC3 — `locationDisplayLevel` chooser missing.** New `<LocationDisplayLevelChooser>` (CityOnly / CityAndStreet / FullAddress) replaces the hardcoded `'CityAndStreet'`. | 2026-05-09 |
| TD-105 | **FR-POST-002 AC4 — Publish enabled with empty fields.** Added `isFormValid` derived from title/city/street/streetNumber and (Give-only) uploads; Publish disabled and dimmed until valid. Companion: typed `PostError` mapping for Postgres FK/CHECK/RLS replaces the bare `Error` so errors surface as Hebrew messages, not generic toasts. | 2026-05-09 |
| TD-100 | **FR-POST-014 AC1 — image carousel missing.** `app/post/[id].tsx` rendered only `mediaAssets[0]`. New `<PostImageCarousel>` (paged horizontal FlatList with counter chip + page-dots) shows every image; falls back to an Ionicons gift/search glyph when empty. | 2026-05-09 |
| TD-111 | **Feed cards never rendered uploaded images.** `PostCardGrid` showed only an emoji placeholder (🎁 / 🔍) regardless of `mediaAssets`. On iOS the emoji rendered as a tofu `?` (same Apple Color Emoji glyph-cache regression as TD-109). Now renders the first image via `getPublicUrl`, falling back to an `Ionicons` gift/search glyph for posts without media. | 2026-05-09 |
| TD-112 | 🟠 | **`SupabaseUserRepository` over 200-line cap (219 lines).** Growing file: `findByHandle` inline mapper added in P0.5 phase-5c. Split into `SupabaseUserRepository.ts` (onboarding slice) + `SupabaseUserRepositoryProfile.ts` (profile/find slice) once more NOT_IMPL methods are wired in P2.4. | P2.4 |

---

## How to add a new TD

1. Pick the next free ID in your lane (BE: `TD-50..99`, FE: `TD-100..149`).
2. Add a row under the right Active section with severity, item, and closing slice.
3. If the TD is blocking the current feature, also link it from the §4 entry in [`HISTORY.md`](./HISTORY.md) when the feature ships.
4. When closing: move the row to "Resolved" with a one-line resolution + date. Don't delete — the cross-reference is useful.
