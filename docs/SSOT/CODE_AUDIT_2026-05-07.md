# Code Audit — Karma Community MVP (2026-05-07)

| Field | Value |
| ----- | ----- |
| **Document Status** | One-shot audit baseline — links findings into `PROJECT_STATUS.md` §6 and the SRS / PRD |
| **Owner** | Engineering / QA |
| **Audit Date** | 2026-05-07 |
| **Scope** | Full repository (`/home/user/MVP-2/`) at HEAD of branch `claude/review-mvp-spec-k4QdO` |
| **Methodology** | (1) Read PRD MVP (`PRD_MVP_CORE_SSOT/`) + SRS (`SRS/02_functional_requirements/`). (2) Inventoried code (domain, application, infrastructure, mobile, supabase migrations, tests). (3) Cross-checked each `FR-*` and `R-MVP-*` against implementation. (4) Searched for anomalies, stale docs, hard-cap violations. |
| **Source PRD / SRS** | [`PRD_MVP_CORE_SSOT/`](./PRD_MVP_CORE_SSOT/00_Index.md), [`SRS.md`](./SRS.md) |
| **Companion** | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) (mirrored in §6 as `TD-12..TD-N`) |

---

## 1. Executive Summary

The architectural skeleton (Clean Architecture: `domain → application → infrastructure-supabase`) is **well-built and faithful to `srs-architecture.mdc`**. Authentication is shipping (Email + Google SSO + guest preview, ~80% of `FR-AUTH-*`). The DB layer for users / posts / follows / blocks is written (migrations 0001–0003), with thoughtful RLS and triggers.

Everything **else is missing**. The MVP cannot demonstrate Product-Market-Fit because the operational core — **post creation, feed, chat, closure, moderation, statistics, notifications** — is either UI-only with mocked data or absent entirely. Without `closed_delivered` (`FR-CLOSURE-003`) the project cannot measure its single North Star metric. Without chat (`FR-CHAT-*`) the PMF loop (delivery coordination) is impossible. Without reports / blocking UI (`FR-MOD-*`) the safety floor required to ship is below threshold.

| Priority | Count | Theme |
| -------- | ----- | ----- |
| 🔥 P0 — MVP blockers | 13 | Missing repos, missing chat schema, no closure / moderation / notifications / stats, image upload stub, onboarding skipped |
| 📈 P1 — PMF quality | 14 | Search, filter persistence, cold-start fallback, realtime, auto-message, read receipts, forgot password, profile edit |
| 📊 P2 — Code & tech debt | 10 | File-size violations, mock data still consumed, type errors, missing tests, no JSDoc, silent fallback bugs |
| 📚 P3 — Documentation drift | 8 | Missing `CODE_QUALITY.md`, broken doc paths, stale `TD-1`, sprint-board out of sync |
| 🛡 Cross-cutting | 4 | Security-definer audit, EXIF strip, public bucket, missing public counter projection |

---

## 2. P0 — MVP Blockers

These items block shipping the MVP. Each maps to one or more `FR-*` IDs that the MVP *requires* and to existing `P0.x` rows in `PROJECT_STATUS.md` §2.

### AUDIT-P0-01 — No `IPostRepository` adapter
- **What**: The port `app/packages/application/src/ports/IPostRepository.ts` (60 LOC) declares `getFeed`, `findById`, `create`, `update`, `delete`, `close`, `reopen`, `getMyPosts`, `countOpenByUser`. There is **no implementation** under `app/packages/infrastructure-supabase/src/`. Confirmed: directory contains only `auth/`, `client.ts`, `database.types.ts`, `index.ts`.
- **Effect**: `(tabs)/index.tsx`, `(tabs)/create.tsx`, and `app/post/[id].tsx` all read `MOCK_POSTS`. The product's primary feature (sharing items) cannot be exercised against the live DB.
- **Maps to**: `FR-POST-001..020`, `FR-FEED-001..002`, `R-MVP-Items-1,3,4,5,6,8,11,13`, `P0.4` in `PROJECT_STATUS.md`.

### AUDIT-P0-02 — No `IUserRepository` adapter
- **What**: Same pattern as AUDIT-P0-01 — port declared (37 LOC), no Supabase adapter.
- **Effect**: `(tabs)/profile.tsx` uses `MOCK_USER`; `user/[handle].tsx` is a stub. Counters (`followers`, `following`, `items_given`, `items_received`, `active_posts_internal`) cannot be read from `users` table.
- **Maps to**: `FR-PROFILE-001..015`.

### AUDIT-P0-03 — No `IChatRepository` adapter
- **What**: Port declared (40 LOC), no implementation. Chat schema also missing (see AUDIT-P0-04).
- **Effect**: `chat/index.tsx` and `chat/[id].tsx` use `MOCK_MESSAGES`. No persistence, no realtime, no read receipts.
- **Maps to**: `FR-CHAT-001..013`, `P0.5`.

### AUDIT-P0-04 — Chat schema missing from migrations
- **What**: `supabase/migrations/` contains only `0001_init_users.sql`, `0002_init_posts.sql`, `0003_init_following_blocking.sql`. There is no `chats` or `messages` table — the planned `P0.2.d` is still pending.
- **Effect**: The PMF loop (post → DM → coordinate → deliver) cannot complete. Chat is the operational glue between the feed and the North Star.
- **Maps to**: `FR-CHAT-001..013`, `P0.5`, planned `P0.2.d`.

### AUDIT-P0-05 — Closure flow not implemented
- **What**: No use cases (`MarkAsDelivered`, `CloseWithoutRecipient`, `Reopen`, `UnmarkRecipient`), no `Recipient` repository, no UI for the closure modal sequence (Step 1 confirm → Step 2 recipient picker → Step 3 educational note).
- **Effect**: `closed_delivered` never increments — the **North Star metric** (300 items in 3 months) cannot be measured. The product can run forever with zero PMF signal.
- **Maps to**: `FR-CLOSURE-001..010`, `R-MVP-Items-4`, `R-MVP-Items-15`, `P0.6`.

### AUDIT-P0-06 — Moderation / reports entirely absent
- **What**: `Report` and `Block` entities exist in `domain/entities.ts`, but there is no `IReportRepository`, no use cases, no UI for reporting / blocking / unblocking. Migration `0003` ships `blocks` table + RLS, but no UI surfaces it.
- **Effect**: Safety floor below ship threshold. Without 3-report auto-removal (`FR-MOD-005`), false-report sanctions (`FR-MOD-010`), or block/unblock UI (`FR-MOD-003..004`), the product cannot legitimately enter public beta.
- **Maps to**: `FR-MOD-001..012`, `R-MVP-Privacy-3,4,4a,5,10`, `R-MVP-Safety-*`, `P1.3`/`P1.4`.

### AUDIT-P0-07 — Notifications entirely absent
- **What**: No `Device` lifecycle management, no push fan-out, no `notification_preferences` table, no FCM/APNs/Web Push wiring.
- **Effect**: Critical notifications required by spec do not exist: new chat message (`FR-NOTIF-001`), recipient marked (`FR-NOTIF-009`), post expiring (`FR-NOTIF-005`), content auto-removed (`FR-NOTIF-011`). Users will not engage; PMF retention metrics will look catastrophic.
- **Maps to**: `FR-NOTIF-001..016`, `P1.5`.

### AUDIT-P0-08 — Statistics not wired
- **What**: `Statistic` and `CommunityStats` entities exist; UI displays counters as hard-coded `0` (`(tabs)/profile.tsx`). No `bg-job-stats-recompute`, no read endpoint for community panel, no activity timeline.
- **Effect**: Post-delivery satisfaction signal absent. Cannot demonstrate PMF to stakeholders.
- **Maps to**: `FR-STATS-001..006`, `P1.6`.

### AUDIT-P0-09 — Counter triggers not written (planned P0.2.f)
- **What**: `users.followers_count`, `users.following_count`, `users.active_posts_count_internal`, `users.items_given_count`, `users.items_received_count` are columns only. No triggers maintain them. Profile counters are tied to TD-10.
- **Effect**: Even when adapters land, profile screens render `0` for everything. Stats screen cannot drive the activity timeline.
- **Maps to**: `FR-PROFILE-001 AC6`, `FR-STATS-002`, `FR-STATS-005`, `P0.2.f`.

### AUDIT-P0-10 — Onboarding wizard skipped
- **What**: `_layout.tsx` routes authenticated users straight to `(tabs)`. There is no Step 1 (Basic Info: name + city), Step 2 (Profile Photo), or Step 3 (Welcome Tour). The soft-gate at first meaningful action is also missing.
- **Effect**: Users without `display_name` / `city` can post, message, follow — violating the spec's contract that a city is captured *before* a post or DM. Feed sort and city-filter logic both depend on `User.city`; without it, `FR-FEED-006` (closest geographically) and `FR-FEED-007` (cold-start fallback) are nonsensical.
- **Maps to**: `FR-AUTH-010`, `FR-AUTH-011`, `FR-AUTH-012`, `FR-AUTH-015`, `P0.3`.

### AUDIT-P0-11 — Image upload stubbed in create-post form
- **What**: `app/apps/mobile/app/(tabs)/create.tsx` (333 LOC) — the "הוסף תמונה" button is a no-op. No `expo-image-picker`, no client-side resize (max 2048px), no upload to `post-images` bucket, no derivative generation, no EXIF strip Edge Function.
- **Effect**: A photo is **mandatory** for `Give` posts (`R-MVP-Items-1`). Publish path is currently broken at the schema level (`media_assets` would be empty).
- **Maps to**: `FR-POST-005`, `R-MVP-Items-1`.

### AUDIT-P0-12 — Apple SSO and Phone OTP placeholders
- **What**: `(auth)/index.tsx` routes Apple and Phone buttons to the email screen. `R-MVP-Core-8` requires Apple SSO on iOS; `FR-AUTH-005` requires phone OTP across all platforms.
- **Effect**: iOS App Store review will reject the app for missing "Sign in with Apple". Phone-OTP is the lowest-friction signup path for Israeli users.
- **Maps to**: `FR-AUTH-004`, `FR-AUTH-005`, `R-MVP-Core-8`, `P3.2`, `P3.3`.

### AUDIT-P0-13 — No "Follow Requests" UI (screen 5.4)
- **What**: Migration `0003` ships `follow_requests` table with full state machine (pending → accepted / rejected / cancelled, 14-day cooldown). There is no UI to list pending requests, approve, or reject them. The Settings → Privacy entry from `FR-FOLLOW-007` does not exist.
- **Effect**: Private-profile users cannot enforce their privacy mode. Approve/reject can only happen via direct DB writes.
- **Maps to**: `FR-FOLLOW-005`, `FR-FOLLOW-006`, `FR-FOLLOW-007`, `R-MVP-Profile-10`, `P1.1`.

---

## 3. P1 — PMF Quality

| ID | Finding | Source | Mapped to |
| -- | ------- | ------ | --------- |
| **AUDIT-P1-01** | Free-text search not implemented (no Hebrew-aware index, no 250 ms debounce). | `(tabs)/index.tsx` | `FR-FEED-003` |
| **AUDIT-P1-02** | Filter persistence missing — `filterStore.ts` is in-memory Zustand only; refresh wipes user filters. | `apps/mobile/src/store/filterStore.ts` | `FR-FEED-005`, `R-MVP-Privacy-8` |
| **AUDIT-P1-03** | Cold-start fallback (empty city → all-Israel banner + clearable chip) not implemented. | `(tabs)/index.tsx` | `FR-FEED-007`, `D-8` |
| **AUDIT-P1-04** | First-post nudge card absent. | `(tabs)/index.tsx` | `FR-FEED-015`, `D-9` |
| **AUDIT-P1-05** | Active-community counter (`FR-FEED-014`) not wired; guest banner uses static string. | `apps/mobile/src/components/GuestJoinModal.tsx` | `FR-FEED-014` |
| **AUDIT-P1-06** | No realtime feed subscription (`supabase.channel()` not used); `↑ N new posts` banner missing. | `apps/mobile/` (no realtime client) | `FR-FEED-009` |
| **AUDIT-P1-07** | Auto-message pre-fill from post not implemented (Hebrew template missing). | `apps/mobile/app/chat/[id].tsx` | `FR-CHAT-005`, `R-MVP-Chat-4` |
| **AUDIT-P1-08** | Read receipts displayed but not driven by `Message.status` Realtime — purely cosmetic. | `apps/mobile/app/chat/[id].tsx` | `FR-CHAT-011`, `R-MVP-Chat-5` |
| **AUDIT-P1-09** | Forgot-password flow not implemented. | `apps/mobile/app/(auth)/` | `FR-AUTH-008`, `P2.3` |
| **AUDIT-P1-10** | Breached-passwords check (top-100k) absent (no HIBP integration). | `app/packages/application/src/auth/SignUpWithEmail.ts` | `FR-AUTH-006 AC1`, `TD-2` |
| **AUDIT-P1-11** | Cold-start deep-link race condition (TD-3). | `apps/mobile/app/_layout.tsx` | `FR-AUTH-013 AC1`, `TD-3` |
| **AUDIT-P1-12** | Bio URL filter (regex blocking http(s) / domains / shorteners) absent — Edit Profile screen also missing. | `apps/mobile/` | `FR-PROFILE-014` |
| **AUDIT-P1-13** | Edit Profile / Privacy toggle / Edit-Profile button on `(tabs)/profile.tsx` are inert. | `apps/mobile/app/(tabs)/profile.tsx` | `FR-PROFILE-005`, `FR-PROFILE-006`, `FR-PROFILE-007`, `P2.4` |
| **AUDIT-P1-14** | `canUpgradeVisibility()` exists in `domain/invariants.ts` but no Edit-post path consumes it; risk of accidental downgrade once Edit ships. | `app/packages/domain/src/invariants.ts` (defined), missing in mobile | `FR-POST-009`, `R-MVP-Privacy-9` |

---

## 4. P2 — Code & Tech Debt

| ID | Finding | Severity |
| -- | ------- | -------- |
| **AUDIT-P2-01** | Hard-cap violation: 7 files exceed `≤ 200 LOC` per `srs-architecture.mdc` § Hard constraints. See [Appendix A](#appendix-a--file-size-violations-200-loc). | High |
| **AUDIT-P2-02** | `apps/mobile/src/mock/data.ts` (TD-5) still consumed by 6 screens: `(guest)/feed.tsx`, `(tabs)/index.tsx`, `chat/index.tsx`, `chat/[id].tsx`, `post/[id].tsx`, `user/[handle].tsx`. | High |
| **AUDIT-P2-03** | Pre-existing TS errors in `app/packages/infrastructure-supabase/src/client.ts` (TD-6): `ConstructorParameters` generic mismatch, missing `@types/node` for `process.env`. | Med |
| **AUDIT-P2-04** | Mobile typecheck DOM-lib collisions (TD-8): `URLSearchParams`, `RequestInfo`, `XMLHttpRequestResponseType`. | Med |
| **AUDIT-P2-05** | Test coverage limited to 6 files (auth use cases + `selectGuestPreviewPosts`). No tests for components, repositories, infra adapters, or invariants. | Med |
| **AUDIT-P2-06** | TSDoc / JSDoc absent on most public exports across `domain`, `application`, `infrastructure`, and mobile components. Onboarding new engineers will require re-reading the SRS file by file. | Med |
| **AUDIT-P2-07** | `post-images` storage bucket is public-read (TD-11). For `OnlyMe` / `FollowersOnly` posts, image URLs are non-discoverable but not protected; needs per-object signed URLs at scale. | Low |
| **AUDIT-P2-08** | Profile counter cards in `(tabs)/profile.tsx` render `0` literally rather than reading from `users.*_count` columns. When P0.2.f triggers land, the UI will not surface them without manual refactor. | Low |
| **AUDIT-P2-09** | `app/post/[id].tsx` falls back to `MOCK_POSTS[0]` when ID is unknown — silent wrong-post display, security/UX risk. Should render not-found state with neutral copy. | Med |
| **AUDIT-P2-10** | No top-level `<ErrorBoundary>` in `_layout.tsx`; any Supabase failure during cold-start can crash the app instead of presenting a friendly state. | Med |

---

## 5. P3 — Documentation Drift / Anomalies

| ID | Finding | Action |
| -- | ------- | ------ |
| **AUDIT-P3-01** | `docs/SSOT/CODE_QUALITY.md` is referenced by `SRS.md`, `srs-architecture.mdc`, and `PROJECT_STATUS.md` as a sibling SSOT but **does not exist** (TD-4). An SSOT that is declared but missing is itself a defect. | Author the file (covers TD-4). |
| **AUDIT-P3-02** | `PROJECT_STATUS.md` §6 row TD-1 claims `database.types.ts` is `type Database = any`. Reality: file is 325 LOC of generated types (verified). TD-1 is stale. | Mark TD-1 resolved; reference this audit. |
| **AUDIT-P3-03** | `CLAUDE.md` references `docs/SSOT/PRD_MVP_SSOT_/`. Actual directory is `docs/SSOT/PRD_MVP_CORE_SSOT/`. Path will break agent bootstrap. | Fix path. |
| **AUDIT-P3-04** | `docs/SSOT/SRS.md:10` references `../../PRD_MVP/00_Index.md`. Actual path is `./PRD_MVP_CORE_SSOT/00_Index.md`. | Fix path. |
| **AUDIT-P3-05** | `PROJECT_STATUS.md` §3 Sprint Board lists "P0.2 — In progress" without indicating P0.2.d/e/f are still entirely unwritten. | Refresh §3 to reflect P0.2.c committed-awaiting-apply, P0.2.d/e/f open. |
| **AUDIT-P3-06** | `docs/SSOT/SRS/appendices/A_traceability_matrix.md` is referenced as the FR ↔ R-MVP ↔ Screen ↔ Test mapping; this audit did not verify whether it is populated. | Verify and populate. |
| **AUDIT-P3-07** | `SRS.md` Last-Updated 2026-05-05 vs `PROJECT_STATUS.md` 2026-05-07. The architecture rule is "every requirement edit updates traceability matrix"; if the SRS truly has not changed since 2026-05-05, fine — but recent UX-polish entries refer to `FR-AUTH-003 AC5 (new)` and `FR-PROFILE-001 AC4/AC6 (new)`, which suggests SRS edits did happen and the date wasn't bumped. | Confirm and sync. |
| **AUDIT-P3-08** | `apps/mobile/src/i18n/he.ts` is 207 LOC. Even as a data file, the project's hard cap (`≤ 200`) applies; it can be split per domain (auth strings, post strings, settings strings). | Split. |

---

## 6. Cross-Cutting Observations

| ID | Observation | Action |
| -- | ----------- | ------ |
| **AUDIT-X-01** | `is_blocked()` and `is_following()` are `SECURITY DEFINER` functions (intentional — see PROJECT_STATUS §4 P0.2.c). They bypass RLS; a defect in their predicate would silently break the privacy contract. | Add SQL probes + a runtime test as soon as P0.4 lands. |
| **AUDIT-X-02** | Supabase anon key is exposed via `EXPO_PUBLIC_*` (correct for client SDKs). The security model **requires** RLS to be exhaustive — no policy gaps. With chat / reports / moderation pending, each new migration is a fresh attack surface. | Treat each new migration as a security review. |
| **AUDIT-X-03** | `FR-POST-005` calls for server-side EXIF stripping, but there is no Edge Function to perform it. Until then, image uploads will leak GPS / device PII inside the JPEG. | Implement EXIF-strip Edge Function before image upload (AUDIT-P0-11) ships. |
| **AUDIT-X-04** | `FR-PROFILE-013` distinguishes `active_posts_count_internal` (owner sees) from `active_posts_count_public` (others see). The `users` table has only the internal column. Risk: leaking the OnlyMe count to viewers when P0.2.f triggers land. | Add the public projection in P0.2.f. |

---

## 7. Suggested Remediation Order

The natural sequence collapses cleanly onto the existing P0.x backlog in `PROJECT_STATUS.md` §2.

1. **P0.2.d — Chat schema** → unlocks AUDIT-P0-03, AUDIT-P0-04, and most of `FR-CHAT-*`.
2. **P0.2.e — Moderation tables** → unlocks AUDIT-P0-06 (`reports`, `moderation_queue`, `audit_events`).
3. **P0.2.f — Counter triggers + community_stats** → unlocks AUDIT-P0-09, AUDIT-P2-08, AUDIT-X-04.
4. **P0.3 — Onboarding wizard** → unlocks AUDIT-P0-10 (and prevents downstream city-less users).
5. **P0.4 — Posts CRUD + image upload** → unlocks AUDIT-P0-01, AUDIT-P0-11; depends on AUDIT-X-03 (EXIF-strip Edge Function).
6. **P0.5 — Chat realtime** → unlocks AUDIT-P0-03 client-side, AUDIT-P1-07, AUDIT-P1-08.
7. **P0.6 — Closure flow** → unlocks AUDIT-P0-05; with this the **North Star starts measuring**.
8. **P1 batch** — moderation UI, notifications, stats screen, profile edit (AUDIT-P0-06/07/08, AUDIT-P0-13, AUDIT-P1-13).
9. **Documentation hygiene** — author `CODE_QUALITY.md`, fix paths, refresh dates, populate traceability matrix.
10. **Code-quality batch** — split files >200 LOC, replace `mock/data.ts` consumers, add JSDoc, add tests for repos and components.

---

## Appendix A — File-size violations (>200 LOC, hard cap)

Per `.cursor/rules/srs-architecture.mdc` § Hard constraints: **≤ 200 lines per file**.

| File | LOC | Excess |
| ---- | --- | ------ |
| `app/apps/mobile/app/(tabs)/create.tsx` | 333 | +133 |
| `app/apps/mobile/app/(auth)/index.tsx` | 266 | +66 |
| `app/apps/mobile/app/(tabs)/profile.tsx` | 214 | +14 |
| `app/apps/mobile/src/components/PostCard.tsx` | 212 | +12 |
| `app/apps/mobile/app/(tabs)/index.tsx` | 209 | +9 |
| `app/apps/mobile/src/i18n/he.ts` | 207 | +7 |
| `app/packages/domain/src/entities.ts` | 205 | +5 |

Total excess: 246 LOC across 7 files. All are organic-growth violations — no single file is 1000-line monolith — so each can be split into 2 cohesive files inside the same directory without architectural change.

## Appendix B — Stale documentation

| Reference | Issue | Truth |
| --------- | ----- | ----- |
| `CLAUDE.md` `docs/SSOT/PRD_MVP_SSOT_/` | Path does not exist | Actual: `PRD_MVP_CORE_SSOT/` |
| `docs/SSOT/SRS.md:10` `../../PRD_MVP/00_Index.md` | Path does not exist | Actual: `./PRD_MVP_CORE_SSOT/00_Index.md` |
| `docs/SSOT/SRS.md` Companion Doc `CODE_QUALITY.md` | File missing | TD-4 unresolved — see AUDIT-P3-01 |
| `PROJECT_STATUS.md` §6 TD-1 — "`database.types.ts` is a stub" | Outdated | File is 325 LOC of real generated types — see AUDIT-P3-02 |
| `PROJECT_STATUS.md` §1 "MVP completion ~15%" | Aggregates two very different states | Auth ~80% / everything-else ~5%; consider a per-domain breakdown |

## Appendix C — Cross-reference index

| Audit ID | SRS / PRD | PROJECT_STATUS row | Existing TD |
| -------- | --------- | ------------------ | ----------- |
| AUDIT-P0-01 | FR-POST-001..020, FR-FEED-001..002 | P0.4 | — |
| AUDIT-P0-02 | FR-PROFILE-001..015 | P0.4, P2.4 | — |
| AUDIT-P0-03 | FR-CHAT-001..013 | P0.5 | — |
| AUDIT-P0-04 | FR-CHAT-001..013 | P0.2 (P0.2.d planned) | — |
| AUDIT-P0-05 | FR-CLOSURE-001..010 | P0.6 | — |
| AUDIT-P0-06 | FR-MOD-001..012 | P1.3, P1.4, P0.2.e | — |
| AUDIT-P0-07 | FR-NOTIF-001..016 | P1.5 | — |
| AUDIT-P0-08 | FR-STATS-001..006 | P1.6 | — |
| AUDIT-P0-09 | FR-PROFILE-001 AC6, FR-STATS-002,005 | P0.2.f | TD-10 |
| AUDIT-P0-10 | FR-AUTH-010..012, 015 | P0.3 | — |
| AUDIT-P0-11 | FR-POST-005 | P0.4 | — |
| AUDIT-P0-12 | FR-AUTH-004, 005 | P3.2, P3.3 | — |
| AUDIT-P0-13 | FR-FOLLOW-005..007 | P1.1 | — |
| AUDIT-P1-09..11 | FR-AUTH-006/008/013 | P2.3 | TD-2, TD-3 |
| AUDIT-P2-02 | — | P0.4 (mock retirement) | TD-5 |
| AUDIT-P2-03 | — | P0.2 | TD-6 |
| AUDIT-P2-04 | — | P0.1 verify | TD-8 |
| AUDIT-P2-07 | FR-POST-005 | P0.4 | TD-11 |
| AUDIT-P3-01 | — | — | TD-4 |
| AUDIT-P3-02 | — | — | TD-1 |

---

*End of audit. Each finding above is mirrored as a `TD-12..TD-N` row in `PROJECT_STATUS.md` §6.*
