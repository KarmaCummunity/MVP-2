# Tech Debt Log — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Owner** | Engineering (auto-updated by agents) |
| **Last Updated** | 2026-05-08 |
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
| TD-40 | 🟠 | `SupabaseUserRepository` is a P0.3.a slice stub — only `getOnboardingState`, `setBasicInfo`, `setOnboardingState` are wired against `public.users`. The remaining 19 `IUserRepository` methods throw `not_implemented`. Adapter file: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`. The `not_implemented` errors include the slice that owns each method. | P0.4 (`findByAuthIdentity`, `findById`) · P1.1 (follows + follow-requests) · P1.4 (blocks) · P2.4 (`update`, `findByHandle`, `delete`) |
| TD-41 | 🟠 | `is_blocked()` and `is_following()` are `SECURITY DEFINER` functions that bypass RLS (intentional — visibility predicates need to read both directions). A predicate defect would silently break the privacy contract with no RLS error. **Mitigation**: SQL probes (vitest under `@kc/infrastructure-supabase`) covering: (a) `is_blocked(A,B)` true when A blocks B; (b) `is_following(A,B)` honors `accepted` follows but not `pending`; (c) `is_post_visible_to()` short-circuits on either side of a block | When P1.1 / P0.5 first exercises FollowersOnly + chat block paths |
| TD-50 | 🟠 | `SupabasePostRepository` and `SupabaseAuthService` have no adapter-level tests (only `pnpm typecheck` + downstream use-case fakes guard them). Pure helpers (`mapPostRow`, `cursor.ts`, `mapAuthError`) deserve unit tests. Adding vitest to `@kc/infrastructure-supabase` is a small focused slice | Opportunistic |

### Mobile & UI (apps/mobile · packages/ui)

| ID | Sev | Item | Closing slice |
| -- | -- | ---- | ------- |
| TD-3 | 🟠 | FR-AUTH-013 AC1 races with deep-links: cold-start session check happens before deep-link routing; needs `expo-router` redirect-with-state pattern | Opportunistic |
| TD-5 | 🟠 | (Originally: `mock/data.ts` consumed by ~5 screens). File deleted in P0.4-FE; remaining screens now consume real repositories. **Residue**: chat list + thread still consume local `MOCK_MESSAGES` inline — closes with TD-15 | P0.5 |
| TD-8 | 🟠 | Mobile typecheck shows duplicate-identifier errors in `lib.dom.d.ts` (`URLSearchParams`, `RequestInfo`, `XMLHttpRequestResponseType`) due to React Native + DOM type collision. Cascades into false "Promise constructor not found" errors. Fix by adjusting `tsconfig.json` `lib` to drop `DOM` or upgrading `@types/react-native` typings | Opportunistic |
| TD-10 | 🟢 | `AuthSession.displayName`/`avatarUrl` are an interim source for "My Profile" header (FR-AUTH-003 AC5). Once a real `Profile` table read is wired (P2.4), the screen reads from `Profile` and these fields become first-render fallback only | P2.4 |
| TD-14 | 🔴 | No `IUserRepository` Supabase adapter usage in profile + user-detail screens (`MOCK_USER` retired but `findByHandle`/`findById` still throw). Profile counter cards still render `0` for everything except active-posts | P2.4 (Other Profile) — P0.4-FE wired My Profile partial |
| TD-18 | 🔴 | Reports + block/unblock + auto-removal + false-report sanctions UI absent | P1.3 + P1.4 |
| TD-22 | 🔴 | Onboarding wizard photo step is a skip-only stub. Slices A + C done; **slice B (camera/gallery + resize + EXIF strip + Storage upload) remains** | P0.3.b (next) |
| TD-24 | 🔴 | Apple SSO + Phone OTP buttons placeholder — required for iOS App Store + Israeli SMS path | P3.2 / P3.3 |
| TD-25 | 🔴 | No "Follow Requests" UI (screen 5.4); private profile not functional client-side | P1.1 |
| TD-26 | 🔴 | Free-text search, filter persistence, cold-start fallback, first-post nudge, community counter, realtime feed all absent | P1.2 |
| TD-27 | 🔴 | Auto-message in chat from post + read-receipt persistence absent | P0.5 |
| TD-28 | 🔴 | Bio URL filter, Edit Profile screen, privacy toggle, upgrade-only enforcement on Edit Post all missing | P2.4 |
| TD-29 | 🟠 | `pnpm lint:arch` enforces `≤ 200 LOC` cap. `(tabs)/index.tsx` (136), `(tabs)/profile.tsx` (214 — allowlisted, was 215), `post/[id].tsx` (165) under or at cap. `(tabs)/create.tsx` ~250 — over cap, allowlisted; `useReducer` extraction tracked as future polish | Opportunistic — (tabs)/create.tsx during P0.6 closure work |
| TD-35 | 🟢 | `i18n/he.ts` (207 LOC) violates `≤ 200 LOC` cap; split per domain | Opportunistic |
| TD-42 | 🟢 | Counter cards in `apps/mobile/app/(tabs)/profile.tsx` — followers/following/items_given/items_received still render `0` (active-posts wired in P0.4-FE). Need `IUserRepository.findById`. **Watch FR-PROFILE-013 / TD-39**: non-owner viewers must read via `active_posts_count_for_viewer()`, never raw `_internal` | P2.4 (with TD-40) |

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

---

## How to add a new TD

1. Pick the next free ID in your lane (BE: `TD-50..99`, FE: `TD-100..149`).
2. Add a row under the right Active section with severity, item, and closing slice.
3. If the TD is blocking the current feature, also link it from the §4 entry in [`HISTORY.md`](./HISTORY.md) when the feature ships.
4. When closing: move the row to "Resolved" with a one-line resolution + date. Don't delete — the cross-reference is useful.
