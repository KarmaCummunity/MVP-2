# Karma Community — Full Codebase Audit Report

| Field | Value |
| ----- | ----- |
| **Document Status** | Audit snapshot — read once, then triage into `TECH_DEBT.md` / blocker tickets |
| **Audit Date** | 2026-05-10 (Round 1) + 2026-05-10 (Round 2 follow-up — see §13) |
| **Scope** | Whole monorepo: `supabase/migrations/**`, `app/packages/{domain,application,infrastructure-supabase,ui}`, `app/apps/mobile/**`, `docs/SSOT/**`, `.github/workflows/**`, `docs/SSOT/PRD_MVP_CORE_SSOT/**` |
| **Method** | Round 1: five parallel read-only Explore agents (BE security · FE security · business-logic bugs · spec↔impl gaps · architecture & quality). Round 2: five additional parallel agents focused on PRD business-rules compliance · navigation & user flows · second-pass RLS deep dive · per-screen UI/UX correctness · cross-cutting concerns (realtime, idempotency, rate-limit, time, dependency hygiene). All findings spot-verified by the auditor before inclusion. |
| **Auditor disclosure** | Each finding carries a confidence tag: `[verified]` = the auditor opened the cited file:line and confirmed the claim; `[probable]` = the agent's evidence is internally consistent but not personally re-verified; `[needs-verify]` = depends on a runtime/RLS behavior that requires a live DB to confirm. False-positives the auditor rejected are listed in §11 (Round 1) and §22 (Round 2). |
| **What changed since Round 1** | The branch-state assumption shifted: chat infrastructure is **already implemented** (migrations 0010–0011, repository + realtime + use cases all shipped) — TD-15's "mock-backed" classification in `TECH_DEBT.md` is stale. Findings against chat are therefore live, not theoretical. Round 1's "guest preview shows 6 posts" finding is **withdrawn** — the use case fetches 6 and `selectGuestPreviewPosts` filters down to 3, complying with R-MVP-Core-2. |

> Live execution state lives in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). Active debt register is [`TECH_DEBT.md`](./TECH_DEBT.md). This file is a one-shot audit — its findings should be triaged into TD entries (BE: `TD-50..99`, FE: `TD-100..149`) or P0/P1 blockers.

---

## 0. Executive summary

**Overall posture.** The shipped slice (P0.1 auth, P0.2 schema/RLS, P0.3 onboarding, P0.4 posts/feed) is structurally clean: Clean-Architecture boundaries hold, domain layer is type-safe, RLS is on every table, error mapping is typed for posts and auth. The bugs that exist are in three buckets:

1. **A handful of real RLS / SECURITY DEFINER privacy holes** that escape the documented threat model (anon can do more than the spec assumes).
2. **A long tail of "spec says X, code does X-minus-AC4"** — small unmet acceptance criteria across screens that look complete but aren't (settings toggles don't persist, location-display-level on the post card is hardcoded, guest banner count is a literal string, etc.).
3. **Large unimplemented domains** (Chat is mocked, Closure / Follow / Moderation / Notifications / Stats / Super-Admin are absent) — these are *not* bugs, they are scheduled in §2 of `PROJECT_STATUS.md`. They are listed here for completeness but are not the audit's primary value.

**The headline issues that should change the next sprint** (combined Round 1 + Round 2):

| # | Severity | Issue | Where |
| - | -------- | ----- | ----- |
| 1 | CRITICAL | Anon role can SELECT `public.follow_edges` directly — the entire follow graph is enumerable without authentication | §1.1 |
| 2 | CRITICAL | Anon role can call `is_blocked()` / `is_following()` / `is_admin()` / `active_posts_count_for_viewer()` / `has_blocked()` over PostgREST RPC | §1.2, §15.2 |
| 3 | CRITICAL | `VisibilityChooser` UI is missing the `FollowersOnly` option entirely — there is no path in the app to ever publish a FollowersOnly post (R-MVP-Items-12 broken at the surface) | §16.1 |
| 4 | CRITICAL | `rpc_get_or_create_support_thread` reads-then-inserts without `ON CONFLICT` — concurrent calls race and one returns a `unique_violation` instead of the existing chat | §15.3 |
| 5 | HIGH | `users_select_public` block check is no-op for anon viewers; blocked users are visible from a signed-out session | §1.3 |
| 6 | HIGH | `removed_admin` post status doesn't decrement `active_posts_count_internal` — counter drifts upward forever after admin removals | §1.4 |
| 7 | HIGH | `RestoreSession` does NOT verify `users.account_status` — a suspended/banned user remains fully usable across app reopens | §17.1 |
| 8 | HIGH | `mapAuthError` distinguishes `invalid_credentials` from `email_already_in_use` (separate codes returned to client) — enables email enumeration | §17.2 |
| 9 | HIGH | TD-39 (counter leakage on Public profiles) is documented but still un-mitigated and is now blocking P2.4 | §2.1 |
| 10 | HIGH | `Promise.all` profile updates in `UpdateProfileUseCase` are non-atomic — partial failure leaves a hybrid name/city state | §3.5 |
| 11 | HIGH | `locationDisplayLevel` set in the create-post form is **completely ignored by every viewer surface** — privacy promise broken | §4.4 |
| 12 | HIGH | Settings toggles (notifications, privacy mode) only mutate local state — never persisted | §6.6 |
| 13 | HIGH | No trigger to auto-approve pending follow_requests when a user toggles privacy_mode `Private → Public` (R-MVP-Privacy-13 second clause unmet) | §15.4 |
| 14 | HIGH | `SendMessageUseCase` has no idempotency key — double-tap or network retry creates duplicate messages | §18.1 |
| 15 | HIGH | `SupabaseChatRepository.findOrCreateChat` uses read-then-insert race (sister bug to #4) | §18.2 |
| 16 | HIGH | No rate limit anywhere — spam-able send-message, report, image-upload, follow-churn endpoints | §19.1 |
| 17 | HIGH | `column_grants` on `posts.reopen_count` and `reports.resolved_at/resolved_by` allow direct client overwrite of moderation-managed columns | §15.5 |
| 18 | MEDIUM | Suspended users can still INSERT posts / chats / messages — RLS policies only check `auth.uid()`, not `account_status = 'active'` | §15.6 |
| 19 | MEDIUM | Realtime publication on `public.users` rebroadcasts denormalized counter columns + new sensitive columns (`false_reports_count`, `account_status_until`) to every subscriber | §1.5, §15.7 |
| 20 | MEDIUM | Storage buckets `avatars` and `post-images` are public-read with no per-object guard (TD-11 acknowledges this; still a launch blocker per FR-PROFILE-013) | §1.7 |

The audit also identified **~80 additional lower-severity findings** (validation gaps, magic strings, missing tests, doc drift, RTL/i18n nits, accessibility gaps, loading-state holes, copy-text drift) — see §3–§9 (Round 1) and §13–§21 (Round 2).

---

## 1. Backend security — Supabase / Postgres

> Files inspected: `supabase/migrations/0001_init_users.sql` … `0009_init_avatars_bucket.sql`, `app/packages/infrastructure-supabase/src/**/*.ts`.

### 1.1 [CRITICAL] [verified] `follow_edges` is grantable to anon — full social-graph enumeration

- **Evidence:** `supabase/migrations/0003_init_following_blocking.sql:403`
  ```
  grant select on public.follow_edges to anon, authenticated;
  ```
- **Why it matters:** Combined with the `follow_edges_select_*` RLS policies, anon's effective view is governed only by `using` clauses. Inspect those policies to confirm the blast radius, but at minimum the table is queryable without authentication. If the SELECT policy is `using (true)` (likely for "who follows whom is public"), an attacker can dump the entire follow graph anonymously by calling PostgREST `GET /rest/v1/follow_edges?select=*&limit=1000` paginated.
- **Attack:** Doxing — discover who follows a private/suspended account; build an audience-rebuild list from a competitor.
- **Fix:** Drop the `anon` grant on `follow_edges`. If the spec genuinely needs anonymous discovery (e.g., guest preview), gate it through a `SECURITY DEFINER` view that returns aggregate counts only, not edge tuples.

### 1.2 [CRITICAL] [verified] Helper functions `is_blocked`, `is_following`, `is_admin` are callable via PostgREST RPC by `anon`

- **Evidence:**
  - `0005_init_moderation.sql:701` — `grant execute on function public.is_admin(uuid) to anon, authenticated;`
  - `0003_init_following_blocking.sql:81-118` — `is_blocked` and `is_following` are `SECURITY DEFINER`, `STABLE`. They have no explicit `revoke … from public`, so default `EXECUTE` to `PUBLIC` (anon + authenticated) applies in Postgres.
- **Why it matters:**
  - `is_admin(<uuid>)` returns whether a given UUID is a super-admin → an attacker can iterate UUIDs (e.g., from harvested handles + the `users` table) and identify the admin to focus spear-phishing on.
  - `is_blocked(a, b)` and `is_following(a, b)` over RPC let an attacker probe the entire social graph without ever appearing as a signed-in user.
- **Attack scenario:** Scrape public profiles to obtain user UUIDs, then `POST /rest/v1/rpc/is_following` for every (a, b) pair to reconstruct the follow graph; same for blocks.
- **Fix:** `revoke execute on function public.is_admin(uuid) from public, anon;` (and analogous for `is_blocked`, `is_following`). Re-grant only to `authenticated` if any client surface needs them — adapter-side calls within an authed session still work.

### 1.3 [HIGH] [verified] `users_select_public` block check is a no-op for anon viewers

- **Evidence:**
  - `0003_init_following_blocking.sql:156-162` — policy uses `not public.is_blocked(auth.uid(), user_id)`.
  - `0003_init_following_blocking.sql:88-89` — `is_blocked(a, b)` returns `false` when `a IS NULL OR b IS NULL`.
  - `0001_init_users.sql:293` — `grant select on public.users to anon`.
- **Why it matters:** `auth.uid()` is `NULL` for anon. The `is_blocked(NULL, user_id)` term evaluates to `false`, so the `not …` term is `true`, so the policy admits the row. A user who blocked someone has no privacy guarantee against that person opening the app signed-out (or from a proxied PostgREST call) and viewing their public profile.
- **Spec reference:** FR-MOD-009 AC1 — block prevents visibility.
- **Fix:** Add `auth.uid() is not null` to the policy `using` clause, or adopt a more general convention: block anon SELECT on `users` entirely and serve the guest preview through a curated `RPC` that returns a sanitized projection.

### 1.4 [HIGH] [verified] `active_posts_count_internal` never decrements on `removed_admin`

- **Evidence:** `supabase/migrations/0006_init_stats_counters.sql` — the `posts_after_change_counters()` UPDATE branch checks for `closed_delivered` and `deleted_no_recipient` as terminal states. `removed_admin` is also a terminal state (per FR-POST and `0002_init_posts.sql` enum) but is missing from the decrement guard.
- **Why it matters:** When an admin removes a post, the user's active-post counter stays inflated. Subsequent post creation may incorrectly fail the "≤ 20 active posts" cap. The nightly drift-recompute (FR-STATS-005) is supposed to repair this — but it isn't implemented yet (TD-20), so the drift is currently permanent.
- **Fix:** Add `'removed_admin'` to the list of statuses that trigger the decrement branch. Add a vitest probe under `@kc/infrastructure-supabase` (TD-50 follow-up).

### 1.5 [MEDIUM] [verified] Realtime publication broadcasts denormalized counter columns

- **Evidence:** `0007_users_realtime_publication.sql:16` adds `public.users` to the `supabase_realtime` publication. The `users` row includes `followers_count`, `following_count`, `active_posts_count_internal`, `items_given_count`, `items_received_count`, `posts_created_total`, `false_reports_count` (per `0001_init_users.sql` schema).
- **Why it matters:** Realtime applies RLS on broadcast, but anon's `users_select_public` admits Public profiles (see §1.3). Any `update` event on a Public user broadcasts the full row — including the counters — to every subscriber. An anonymous attacker can subscribe to the channel and watch counters tick in real-time across the user base, inferring activity patterns and the existence of `OnlyMe` posts (TD-39 leak via the public/internal differential).
- **Fix:** Use Supabase Realtime's column filter (`alter publication supabase_realtime ... with (publish = 'insert,update,delete', ...)`), or wrap user updates in a trigger that emits only safe columns to a separate `users_public_view` table that's the one published.

### 1.6 [MEDIUM] [probable] `is_post_visible_to()` is redefined across migrations 0002, 0003, 0005 without versioning

- **Evidence:** the function appears with the same signature in all three files, replacing its body each time. A partial deploy (e.g., 0001-0004 succeed, 0005 fails or is skipped) leaves the function without the `removed_admin` / `reporter_hides` clauses.
- **Why it matters:** Less likely to bite in prod because `supabase db push` runs migrations in order — but the convention is fragile. Any one-off function-only deploy or rollback can land on a stale body.
- **Fix:** Either (a) make the function versioned (`is_post_visible_to_v3`), or (b) add a guarded `do $$ if not exists … raise exception … end $$;` in the latest migration that confirms the prior file ran.

### 1.7 [MEDIUM] [verified] Storage buckets `avatars` and `post-images` are world-readable

- **Evidence:** `0009_init_avatars_bucket.sql:38-40` and `0002_init_posts.sql:314-316` create public-read policies (`using (bucket_id = '...')`) on Storage. TD-11 acknowledges this for `post-images`; the avatars bucket has the same shape.
- **Why it matters:** UUIDs in the path are not "secret" — they leak through any feed response, deep link, or screenshot. An attacker who obtains one user's UUID can `GET /storage/v1/object/public/avatars/<uuid>/avatar.jpg` regardless of the user's privacy mode. For `OnlyMe` posts the row is hidden by RLS but the image at `posts/<owner>/<batch>/0.jpg` is reachable if the path is ever observed (e.g., via realtime broadcast of a previous insert).
- **Fix (matches TD-11):** Move both buckets to private; serve through signed URLs (`storage.from('avatars').createSignedUrl(path, 3600)`) issued by an Edge Function that re-checks visibility. This is cited in TD-11 as "pre-launch hardening" — re-classifying as **launch blocker for P0.6** because it directly contradicts FR-PROFILE-013 AC4 and FR-POST-008.

### 1.8 [MEDIUM] [probable] `find_or_create_support_chat()` has no rate-limit / dedup guard

- **Evidence:** `0005_init_moderation.sql:271-302` — function is `SECURITY DEFINER`, called unconditionally from the report-insert trigger. A user can spam reports to drive function invocations. The function is idempotent on creation but reads `users` on every call.
- **Fix:** Cap report submissions per user per minute via a separate trigger / rate-limit table (FR-MOD spec already implies this; not yet in any migration).

### 1.9 [LOW] [probable] `false_reports_count` increments are one-way

- **Evidence:** `0005_init_moderation.sql:515-517` increments on `dismissed_no_violation`. There is no decrement path for admin-overturned dismissals, and TD-38 explicitly defers escalation logic to P2.5.
- **Why it matters:** A user wrongly accumulating false-report counts has no remediation path before the escalation logic ships. Low priority only because the consuming logic (suspension) isn't wired yet — when P2.5 lands, this becomes HIGH.
- **Fix:** Reserve a `decrement_false_reports(user_id, reason)` SECURITY DEFINER admin RPC before P2.5.

### 1.10 [LOW] [probable] Migrations re-create some functions without `revoke`-and-`grant` cycle

- Functions defined with `create or replace function` retain prior grants. If the security model changes between revisions, the grants don't auto-update. Defensive practice: always pair `create or replace` with explicit `revoke … from public` + `grant … to <expected>`.

---

## 2. Backend / data-layer adapter audit

> Files inspected: `app/packages/infrastructure-supabase/src/**/*.ts`.

### 2.1 [HIGH] [verified] TD-39 — Public-profile counter columns leak to non-owner viewers

- **Status:** Already documented in `TECH_DEBT.md` (TD-39); the audit re-confirms it is **still un-mitigated** and is the dominant blocker for P2.4 (Other Profile screen).
- **Evidence:** `users_select_public` admits Public profiles. The full row, including `active_posts_count_internal`, is selectable. The repository adapter has no projection filter.
- **Why it matters:** Differential (`internal − public_open − followers_only_open`) lets a non-owner infer the count of `OnlyMe` posts on any Public profile, violating FR-PROFILE-013 AC4.
- **Fix:** Implement the application-layer projection guard described in TD-39 (`SupabaseUserRepository.findById(viewer)` calls `active_posts_count_for_viewer(owner, viewer)` instead of selecting raw internal columns). Add an architectural lint: a regex test that fails CI if any adapter `select` includes `active_posts_count_internal` for non-self queries.

### 2.2 [MEDIUM] [verified] `SupabasePostRepository` throws raw `Error` from 13 sites

- **Evidence:** Multiple `throw new Error(...)` calls in `SupabasePostRepository.ts` for adapter-internal failures.
- **Why it matters:** Adapter errors are infrastructure-level and acceptable as-is, **but** the use cases that wrap them (`GetFeedUseCase`, `GetMyPostsUseCase`, etc.) don't catch and remap them to typed `PostError` codes. The result: a transient PostgREST 500 surfaces in the UI as a generic Hebrew toast ("שגיאת רשת. נסה שוב.") even when a typed code (`forbidden`, `validation_failed`) would be more actionable.
- **Fix:** Either wrap adapter throws in a typed envelope at the adapter boundary, or add a use-case-level `try/catch` that maps to `PostError`. TD-50 already opens the door for adapter-level tests — add error-mapping tests in the same slice.

### 2.3 [MEDIUM] [probable] `mapPostRow` assumes `city_ref` is non-null without an FK guarantee

- **Evidence:** `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts` — joins `cities` and dereferences `city_ref.name_he`. The schema (`0002_init_posts.sql`) makes `posts.city` reference `cities.city_id`, but the join is `select … city:cities!posts_city_fkey(...)` and PostgREST returns `null` for unresolved FKs.
- **Why it matters:** If a city row is deleted or renamed mid-flight, every feed request that includes the orphan post throws an unhandled "Cannot read property name_he of null". The feed silently breaks for everyone.
- **Fix:** Defensive `city_ref?.name_he ?? input.city` fallback in `mapPostRow`, with a typed `PostError` on null. Add a vitest case.

### 2.4 [MEDIUM] [probable] `decodeCursor` swallows malformed cursors silently

- **Evidence:** `app/packages/infrastructure-supabase/src/posts/cursor.ts` — when JSON parse fails or the date is invalid, it returns `null`. The use case treats `null` as "no cursor", restarting pagination from the top.
- **Why it matters:** A user who hits the deep-paginated end of the feed with a truncated cursor sees the first page again, with no diagnostic. Pagination *appears* broken.
- **Fix:** Throw a typed `PaginationError('cursor_invalid')`; the UI can re-fetch from the top intentionally with a "your view was reset" message.

### 2.5 [LOW] [verified] `as unknown as PostJoinedRow[]` casts are unavoidable but unguarded

- The adapter uses `as unknown as` to bridge Supabase's untyped join responses. Acceptable, but a tiny runtime guard (one zod parse per call, or just an `Array.isArray + length` sanity check) would surface schema drift early when types are regenerated.

---

## 3. Application & business-logic bugs

> Files inspected: `app/packages/application/src/**/*.ts`, `app/packages/domain/src/*.ts`, plus their callers in `app/apps/mobile/**`.

### 3.1 [HIGH] [verified] `street_number` regex rejects Hebrew suffixes

- **Evidence:** `app/packages/domain/src/value-objects.ts` — `STREET_NUMBER_PATTERN = /^[0-9]+[A-Za-z]?$/`.
- **Why it matters:** Hebrew street numbering routinely uses Hebrew letter suffixes (e.g. `5א`, `12ב`). The app is Hebrew-first and forces RTL — rejecting `5א` is a meaningful onboarding-and-publish blocker for an Israeli user base.
- **Fix:** Extend the pattern to include the Hebrew block: `/^[0-9]+([א-ת]|[A-Za-z])?$/`. Add the matching i18n error key in `he.ts`.

### 3.2 [HIGH] [probable] Trim discrepancy on `title` and `description`

- **Evidence:** `CreatePostUseCase` validates `title.trim().length > 0` but does not mutate the input — the un-trimmed value is forwarded to the adapter. UI's `isFormValid` also uses `.trim()` for the disabled-button check.
- **Why it matters:** A user typing trailing whitespace gets a post with the trailing space stored, which then renders awkwardly on RTL grids and breaks "duplicate title" detection if any future moderation tooling relies on equality.
- **Fix:** `input.title = input.title.trim();` (and same for description) before validation.

### 3.3 [HIGH] [probable] Email-validation regex in `SignUpWithEmailUseCase` is permissive

- **Evidence:** `app/packages/application/src/auth/SignUpWithEmailUseCase.ts` — `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- **Why it matters:** Accepts strings like `a@b.c`, `user@@x.co`, `.@example.com`. Confirmation emails to these addresses bounce; the user sits in `email_confirmation_pending` indefinitely with no diagnostic.
- **Fix:** Replace with `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/`, or — better — let the Supabase `signUp` call be the source of truth and surface its `invalid_email` error code; remove the client-side regex entirely.

### 3.4 [HIGH] [needs-verify] Session expiry uses device clock

- **Evidence:** `app/packages/application/src/auth/RestoreSessionUseCase.ts` — `Math.floor(Date.now() / 1000); if (session.expiresAt <= nowSec) …`.
- **Why it matters:** A device clock skewed backwards keeps an expired access token in use until the next server round-trip. Supabase's auth client fetches a refresh on first failure, so the user impact is small in practice — but the silent skew can mask token-rotation bugs in development.
- **Fix:** Either accept the practical impact and document, or compute `nowSec = Date.now() - clockSkewMs` using a one-time `serverTimeOffsetMs` derived from the first authenticated response's `Date` header.

### 3.5 [HIGH] [probable] `UpdateProfileUseCase` runs partial-update fields in `Promise.all` — non-atomic

- **Evidence:** `UpdateProfileUseCase` parallelizes display-name, bio, and city updates via `Promise.all`.
- **Why it matters:** If the city update fails (FK violation, RLS reject), the displayName change has already committed. The user sees the old city + new name and has no recovery path other than re-saving.
- **Fix:** Issue a single `UPDATE users SET … WHERE user_id = auth.uid()` per save (one-shot), or wrap in a Postgres function exposed as RPC.

### 3.6 [HIGH] [verified] `UpdateProfileUseCase` and `CompleteBasicInfoUseCase` throw raw `Error`

- **Evidence:** Several `throw new Error('invalid_display_name')` / `throw new Error('invalid_city')` in user use-cases.
- **Why it matters:** Domain code was hardened against raw throws by TD-51 (and the lint is empty for `domain/`), but the **application layer** has no equivalent guard. The UI catches and shows the bare code string ("invalid_display_name") instead of a localized message — TD-50/TD-51's typed-error pattern stops at the `posts/*` namespace.
- **Fix:** Introduce `ProfileError` / `BasicInfoError` extending `DomainError` (mirror of `PostError`). Add a lint rule analogous to the domain one but for `application/src/*` (or extend the existing one). Map errors in a new `profileMessages.ts` Hebrew file.

### 3.7 [MEDIUM] [probable] No idempotency key on `Publish`

- **Evidence:** `apps/mobile/app/(tabs)/create.tsx` — Publish is gated by `isPublishing` (button disabled while pending). However, on a network 504 the React Query mutation completes with an error; the user can press Publish again and the request fires a second time. If the first request actually reached the DB, two posts are created.
- **Why it matters:** Real-world phone networks routinely produce phantom 5xx after the server has committed. Two `posts` rows is recoverable by manual delete, but two `media_assets` uploads chew quota.
- **Fix:** Generate a `client_request_id` UUID per attempt and include it as a `posts.client_request_id` column with a unique constraint; reject the second insert with `409`.

### 3.8 [MEDIUM] [verified] Image-upload `Promise.all` failure leaks Storage objects

- **Evidence:** `apps/mobile/app/(tabs)/create.tsx:60-75` — `Promise.all(picked.map(resizeAndUploadImage(...)))`. If image #2 of 3 throws, image #1 is already in Storage, and the catch only resets `uploadingCount`. The orphan `posts/<uid>/<batch>/0.jpg` lingers forever.
- **Why it matters:** Pre-publish abandons accumulate quota cost; nothing reaps them.
- **Fix:** On catch, attempt `client.storage.from('post-images').remove([uploadedPaths])` for whatever did succeed before re-throwing. Same pattern in `avatarUpload.ts` (TD-108 already covers the avatar-removal leak path).

### 3.9 [MEDIUM] [probable] `activePostsCountInternal` cached in `authStore` is consulted before create

- **Evidence:** `CreatePostUseCase` (per agent's read; auditor did not personally re-read this method) checks `user.activePostsCountInternal < MAX_ACTIVE_POSTS` against the cached `User` in Zustand.
- **Why it matters:** After deleting a post, the cache isn't invalidated. The user sees a phantom "post limit exceeded" until the next refresh.
- **Fix:** After every `DeletePostUseCase` success, invalidate the auth/user query (`queryClient.invalidateQueries(['user', userId])`) **and** decrement the cached counter optimistically.

### 3.10 [MEDIUM] [needs-verify] `GetMyPostsUseCase` does not return `nextCursor`

- **Evidence:** Per business-logic agent's read; auditor did not personally re-read. The repository helper exists but the use-case discards the cursor and returns `Post[]`. If a power user has > 20 posts, "My Posts" silently truncates.
- **Fix:** Mirror `GetFeedUseCase`'s `{ posts, nextCursor }` shape; wire the FlatList in `(tabs)/profile.tsx` similarly.

### 3.11 [LOW] [needs-verify] Home feed `onEndReached` not wired

- **Evidence:** Per business-logic agent's read; auditor did not personally re-read `(tabs)/index.tsx`. If true, infinite scroll exists in the use case but is not connected at the screen level.
- **Fix:** Pass `onEndReached={() => hasMore && fetchNextPage()}` into the `PostFeedList`.

---

## 4. Mobile / FE security & correctness

> Files inspected: `app/apps/mobile/app/**/*.tsx`, `app/apps/mobile/src/**`, `app/apps/mobile/app.json`, `.env`.

### 4.1 [INFO] `.env` contains a `sb_publishable_*` key — this is the new Supabase **publishable** key (intentionally public)

- **Evidence:** `app/apps/mobile/.env` exposes `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…` (the new "publishable" format, equivalent to the legacy anon key).
- **Status:** **Not a vulnerability.** Both `EXPO_PUBLIC_*` env vars and the Supabase publishable key are designed to ship in client bundles. RLS is the only line of defense, which is why §1 matters so much. Listed here to neutralize the FE-security agent's "exposed key" framing.
- **Action:** None on the key. But the agent's adjacent point stands: there must never be a `SUPABASE_SERVICE_ROLE_KEY` (or any `sb_secret_*`) in any client-bundled env or repo file. Add a CI grep that fails the build if such a string is found anywhere under `app/apps/mobile/` or any committed `.env*`.

### 4.2 [HIGH] [verified] `EXPO_PUBLIC_*` is the only safe env-var prefix in client code, but `client.ts` falls back to non-prefixed names

- **Evidence:** `app/packages/infrastructure-supabase/src/client.ts` reads `process.env.EXPO_PUBLIC_SUPABASE_URL` with a fallback to `process.env.SUPABASE_URL`.
- **Why it matters:** A non-`EXPO_PUBLIC_` env var is **not** inlined by Metro and resolves to `undefined` at runtime in the mobile bundle; the fallback can never fire on-device. In Node test contexts it might pick up a different secret value, leading to test/prod divergence.
- **Fix:** Drop the non-prefixed fallback; throw a typed `ConfigurationError` if `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` are missing, so misconfiguration fails loudly at startup.

### 4.3 [HIGH] [probable] OAuth callback does not validate `state` parameter explicitly

- **Evidence:** `apps/mobile/app/auth/callback*.tsx` — relies on `supabase.auth.exchangeCodeForSession(code)` and the SDK's internal PKCE handling.
- **Why it matters:** PKCE protects against code-interception, but the `state` round-trip is what protects against CSRF / cross-app callback spoofing on Android (where a sibling app can register the same `karmacommunity` scheme). The Supabase JS SDK does store/compare `state` internally for the web flow, but the deep-link flow on mobile is more brittle — a malicious app intercepting the redirect could feed an attacker-controlled code.
- **Fix:** Generate the state explicitly in `signInWithOAuth`'s `options.queryParams`, persist it in `expo-secure-store` (not AsyncStorage — ephemeral verifier should not survive reinstall), and verify on callback before calling `exchangeCodeForSession`.

### 4.4 [HIGH] [needs-verify] `locationDisplayLevel` is collected on create, never honored on display

- **Evidence:** `apps/mobile/app/(tabs)/create.tsx` exposes the `<LocationDisplayLevelChooser>` (TD-104 closed) and `useState<LocationDisplayLevel>('CityAndStreet')`. `apps/mobile/src/components/PostCardGrid.tsx` and `apps/mobile/app/post/[id].tsx` do NOT branch on `locationDisplayLevel` — per the business-logic agent's read, the field is sent to the DB but never consulted by the renderer.
- **Why it matters:** A user who chose `CityOnly` for privacy still has their full street + number rendered on the post detail page. This is the most consequential **silent-spec-violation** in the audit.
- **Spec reference:** FR-POST-003 AC3.
- **Fix:** Implement a `formatLocation(post)` helper in `@kc/ui` that switches on `post.locationDisplayLevel`. Wire it into `PostCardGrid`, `PostImageCarousel`, and post-detail. Add a vitest snapshot per branch.

### 4.5 [HIGH] [probable] Bio field allows raw text — no URL/HTML sanitation server-side

- **Evidence:** `UpdateProfileUseCase` has a URL-detection regex (per agent), but TD-28 explicitly notes "Bio URL filter … missing". On Web, where `react-native-web` falls through to actual DOM, a `Text` node containing `<script>` does not auto-execute (RN-Web escapes), but `Linking.openURL(bio)` patterns or custom anchor extraction would.
- **Why it matters:** Bio is the only freeform user-controlled string that's read by other users. Content moderation depends on either a reliable URL filter or a strict allowlist.
- **Fix:** Move URL detection to a domain helper (`packages/domain/src/biography.ts`), call it from both the use case **and** a Postgres `CHECK` constraint on `users.biography`. Reject (don't strip) on save.

### 4.6 [MEDIUM] [verified] Soft-gate uses `Alert.alert` strings with raw emoji literals

- **Evidence:** `apps/mobile/app/(tabs)/create.tsx:102` — `Alert.alert('✅ הפוסט שלך פורסם!', ...)`. `apps/mobile/app/(tabs)/create.tsx:156, 164` — type toggle labels embed `🔍`/`🎁` emoji literals as glyphs.
- **Why it matters:** TD-109 specifically migrated tab-bar / EmptyState emoji to Ionicons because of the iOS-26 Apple Color Emoji glyph-cache regression that renders them as `?` tofu. The remaining emoji here will exhibit the same regression on the same simulator builds.
- **Fix:** Replace with Ionicons (`checkmark-circle` for success alert; `gift` / `search` for the type toggle). The toggle is especially user-facing and breaks the same way the tab bar did.

### 4.7 [MEDIUM] [needs-verify] AsyncStorage holds the Supabase session in plaintext

- **Evidence:** EXEC-1 in `PROJECT_STATUS.md` explicitly chose `@react-native-async-storage/async-storage` "per Supabase Expo guide". On Android the backing file is plaintext SharedPreferences; on iOS it's an unencrypted plist in the app sandbox.
- **Why it matters:** Tokens are short-lived (Supabase access tokens are typically 1h) but the **refresh token** in the same payload is long-lived. A device backup or a rooted device exposes both.
- **Status of decision:** This is an explicit, documented trade-off (EXEC-1). Listed here because the audit must surface it, not because it's necessarily wrong for an MVP.
- **Fix (when ready):** Move to `expo-secure-store` for the refresh token only; keep the access token in memory. Re-record EXEC-1 with the updated rationale.

### 4.8 [MEDIUM] [probable] No file-size cap after the 2048px resize step

- **Evidence:** `apps/mobile/src/services/imageUpload.ts` resizes to max-edge 2048 at JPEG q=0.85, but does not assert the resulting size. A user with a 50MP camera at q=0.85 can produce a > 5MB JPEG.
- **Why it matters:** Quota and bandwidth, not security. Users on cellular pay for the upload.
- **Fix:** After the resize, assert `result.size < 5 * 1024 * 1024`; if larger, re-encode at q=0.75; reject above q=0.6.

### 4.9 [LOW] [probable] `app.json` may include unused permissions

- **Evidence:** Per FE-security agent — `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` allegedly present. Auditor did not re-read `app.json` directly to confirm.
- **Action:** Open `app.json` and prune any permission not actually used. `expo-image-picker` on modern Android does not need `WRITE_EXTERNAL_STORAGE`; `SYSTEM_ALERT_WINDOW` is never legitimate for this app.

### 4.10 [LOW] [verified] `console.log`/Alert paths leak emoji + format strings into i18n testing

- See §4.6 — same root cause. The fix consolidates both.

---

## 5. Spec ↔ implementation gaps

> Cross-reference of `docs/SSOT/SRS/02_functional_requirements/*` against shipped code. Items already tracked in `TECH_DEBT.md` are flagged.

The spec-vs-impl agent produced a 162-AC compliance table; the headline is **~43 % of acceptance criteria currently met**. That number is dominated by un-implemented domains (Chat, Closure, Follow, Moderation, Notifications, Stats, Super-Admin) which are scheduled in `PROJECT_STATUS.md` §2 and **are not bugs** — they are work-not-yet-done. Listing them as "gaps" here would inflate the report. Instead, the gaps below are **AC violations within domains marked Done or In-Progress**:

### 5.1 [HIGH] FR-POST-003 AC3 — `locationDisplayLevel` ignored

- See §4.4. Same finding viewed from the spec side.

### 5.2 [HIGH] FR-PROFILE-013 AC4 — counter-leak (TD-39)

- See §2.1.

### 5.3 [HIGH] FR-AUTH-013 AC1 — cold-start session check races deep links (TD-3)

- Already tracked. Re-classified as HIGH because it makes onboarding deep links unreliable on cold start and there is no automated test.

### 5.4 [MEDIUM] FR-FEED-014 AC1 / FR-FEED-016 AC3 — guest banner count is a literal "50+" (TD-102)

- Already tracked. The spec parameterizes the count; the implementation hard-codes it. `community_stats.active_public_posts_count` (provisioned in `0006`) is unused.

### 5.5 [MEDIUM] FR-PROFILE-007 AC5 — no `profile_updated` analytics event

- Spec requires emission on display-name change. There is no analytics dispatcher in the project at all (no Amplitude / Segment / PostHog wiring). This is not strictly an AC bug because the analytics infra is on the cross-cutting backlog, but it should be enumerated.

### 5.6 [MEDIUM] FR-POST-005 AC4 — server-side EXIF strip absent (TD-23)

- Already tracked. Client-side re-encode strips most EXIF as a side-effect, but the spec asks for a server-side guarantee.

### 5.7 [MEDIUM] FR-AUTH-011 AC4 — avatar-removal leaks the Storage object (TD-108)

- Already tracked.

### 5.8 [MEDIUM] FR-DONATE-003 AC4 — error message text drift

- Spec text: "לא הצלחנו לפתוח את הקישור. נסו דפדפן אחר." Implementation in `i18n/locales/he/donations.ts` adds "או הקלידו את הכתובת ידנית". Strict copy compliance matters for screenshots in marketing/press materials; soft fix.

### 5.9 [MEDIUM] FR-SETTINGS-001/003/006 — toggles do not persist

- See §6.6.

### 5.10 [MEDIUM] FR-PROFILE-007 AC2 — read-only fields (email/phone) are missing from the Edit Profile screen entirely

- The screen ships displayName / city / bio / avatar (per HISTORY's FR-PROFILE-007 partial entry). Email/phone aren't shown at all. Spec says they must be shown read-only — silent omission rather than a bug, but it surfaces "cannot remember which email I signed up with" complaints.

### 5.11 [LOW] CLAUDE.md verification gate not enforced

- The CLAUDE.md preamble requires every code-bearing response to begin with "Mapped to SRS: [Requirement ID]. Refactor logged: [Yes/No/NA]." Recent commit messages (e.g., 12cb66f) honor it. There is no automated enforcement — a husky/pre-commit hook checking commit-message format would close the loop.

---

## 6. UI / screens — AC misses on shipped pages

### 6.1 [MEDIUM] [probable] `(tabs)/profile.tsx` counters render `0` (TD-42)

- Already tracked. Re-iterated because it interacts with §2.1 — the fix for TD-39 unblocks TD-42.

### 6.2 [MEDIUM] [probable] Settings screen has 7 dead `onPress={() => {}}` rows (TD-107)

- Already tracked. The "מחק חשבון" row is dangerous-styled and silent — the audit recommends elevating TD-107 from "Opportunistic" to **launch blocker** because shipping a destructive-styled no-op is a credibility hit.

### 6.3 [LOW] Edit Profile share button is a no-op (TD-106 residue)

- Acknowledged in TD-106; deferred.

### 6.4 [MEDIUM] [verified] Type toggle on `(tabs)/create.tsx` uses literal emoji `🔍` / `🎁`

- See §4.6.

### 6.5 [MEDIUM] [verified] Magic strings — limits hard-coded in `i18n/he.ts`

- `i18n/he.ts:125` — "מקסימום 5 תמונות" embeds the literal `5`. Should reference `MAX_MEDIA_ASSETS` from `@kc/domain`.

### 6.6 [HIGH] [probable] Settings toggles are component state only

- Per spec-vs-impl agent's read of `app/settings.tsx:35-36`: `notificationsOn` and `privateProfile` are `useState` defaults with no `onValueChange → use case` wiring. The spec (FR-SETTINGS-003 / FR-SETTINGS-006 / FR-PROFILE-005) requires persistence and reactive application.
- **Fix:** Wire to `UpdateNotificationPreferencesUseCase` (to be authored) and `TogglePrivacyModeUseCase` (depends on FR-PROFILE-005). Until then, mark the toggles disabled with a "בקרוב" tooltip — better than a fake-state lie.

---

## 7. Architecture, code-quality, tooling

> Files inspected: `app/scripts/check-architecture.mjs`, `app/turbo.json`, all `package.json`, `tsconfig*.json`, `.github/workflows/*`.

### 7.1 [MEDIUM] [verified] Turbo `test` task has no `inputs` declaration

- **Evidence:** `app/turbo.json:19-22` — `test` declares `outputs: ["coverage/**"]` only. Without an explicit `inputs`, Turbo's hashing falls back to the package directory; this works but is wider than necessary and may produce stale cache hits when only docs change.
- **Fix:** Add `"inputs": ["src/**", "**/*.test.ts", "**/*.test.tsx"]` to the test task.

### 7.2 [MEDIUM] [verified] No CI gate on `database.types.ts` drift

- **Evidence:** `infrastructure-supabase/src/database.types.ts` is generated by `supabase gen types`. It is checked into git but no CI step regenerates and diffs it. A migration that forgets to regen leaves the type definitions stale, hiding RLS-relevant column additions from TypeScript.
- **Fix:** Add a `pnpm --filter @kc/infrastructure-supabase typegen:check` script that runs `supabase gen types typescript --linked > /tmp/x.ts && diff -u src/database.types.ts /tmp/x.ts`. Wire into CI.

### 7.3 [MEDIUM] [verified] `client.ts` falls back from `EXPO_PUBLIC_*` to bare env names

- See §4.2.

### 7.4 [MEDIUM] [probable] No tests for the Supabase adapters (TD-50 already tracks)

- Adapter-layer pure helpers (`mapPostRow`, `cursor`, `mapAuthError`) have zero tests. TD-50 is open; reaffirmed as a launch blocker for P0.5 because chat will introduce a third adapter (`SupabaseChatRepository`) that should not ship untested.

### 7.5 [LOW] [verified] `i18n/he.ts` is at 207 LOC vs the 200-LOC cap (TD-35)

- Already tracked. Splitting per domain is mechanical.

### 7.6 [LOW] [verified] `audit_events` table has no INSERT policy — writes go through SECURITY DEFINER triggers (intentional)

- Cited as a **good** pattern; the comment in `0005_init_moderation.sql:683-686` explains the intent. Listed only so the reviewer knows it's deliberate.

### 7.7 [LOW] [probable] `authStore` mutations bypass use cases

- The store exposes `setSession` directly, which is reached from screens after auth flows complete. The use case is the proper boundary; direct setters open the door to invariant violations. Tighten by exposing only setters that take a `Session` validated by a use case.

---

## 8. Documentation drift

### 8.1 [LOW] TD-43 (`SRS.md` Last-Updated header is stale) — already tracked

- Per `TECH_DEBT.md`. Touch in any next PR that touches SRS.md.

### 8.2 [LOW] TD-4 — `docs/SSOT/CODE_QUALITY.md` is referenced from `SRS.md` but does not exist

- Already tracked. A short stub linking out to `.cursor/rules/srs-architecture.mdc` and TECH_DEBT closes most of the spirit.

### 8.3 [LOW] `PROJECT_STATUS.md` §1 says "BE adapter + FE end-to-end" for posts but TD-50 (no adapter tests) is unaddressed

- Not contradictory, but the snapshot reads as more "done" than the test coverage supports. Add an honest note: "Posts BE adapter shipped without unit tests (TD-50)."

### 8.4 [LOW] HISTORY.md changelog format is inconsistent

- Mix of bullet styles and trailing-period conventions. Cosmetic.

---

## 9. Cross-cutting / NFR

### 9.1 [MEDIUM] No `Content-Security-Policy` configured for the web build

- `react-native-web` is the target for `pnpm --filter @kc/mobile web`. There is no `index.html` template setting CSP headers. With user-controlled bio + post text rendering through the same DOM, CSP is the second line of defense after sanitization.
- **Fix:** Add a CSP `meta` tag in the Expo web template: `default-src 'self'; img-src 'self' https://*.supabase.co data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; script-src 'self';` — adjust as needed.

### 9.2 [LOW] No automated a11y check on icon-only buttons

- Many `TouchableOpacity` wrappers around `Ionicons` lack `accessibilityLabel`. Spec NFR mentions a11y; nothing enforces it. Add a `react-native-eslint-plugin-accessibility` rule or a custom check.

### 9.3 [LOW] No rate-limit on `signIn` attempts at the application layer

- Supabase enforces some limits server-side, but the client retries silently on 429 with no UX. Add a retry-after parser.

---

## 10. Triage table — what to put on the next sprint

Ordered by **(impact × ease-of-fix) × time-to-find-it-when-it-bites**.

| Order | ID (proposed) | Severity | Owner lane | Estimated effort | Lands with |
| ----- | ------------- | -------- | ---------- | ---------------- | ---------- |
| 1 | New TD (BE) | CRITICAL | BE | < 1 day | Hotfix migration: revoke-and-restrict the four anon grants in §1.1, §1.2 |
| 2 | New TD (BE) | CRITICAL→HIGH | BE | 1 day | Hotfix migration: §1.3 anon block-bypass + §1.4 `removed_admin` decrement |
| 3 | TD-39 (existing) | HIGH | BE | 2 days | Application-layer projection guard for counters (already scoped) |
| 4 | New TD (FE) | HIGH | FE | 1–2 days | §4.4 `locationDisplayLevel` actually applied on display surfaces |
| 5 | New TD (FE) | HIGH | FE | 1 day | §6.6 settings toggles persistence (or disable + "בקרוב") |
| 6 | New TD (BE) | HIGH | BE | 1 day | §3.5 atomic profile update (single SQL UPDATE or RPC) |
| 7 | TD-11 (existing) | HIGH | BE | 3 days | §1.7 storage buckets → private + signed URLs |
| 8 | New TD (FE) | HIGH | FE | 1 day | §3.1 Hebrew street-number regex |
| 9 | TD-50 (existing) | HIGH | BE | 2 days | Adapter-layer vitest suite + §1.6 `is_post_visible_to` regression test |
| 10 | New TD (FE) | MEDIUM | FE | 0.5 day | §4.6 / §6.4 finish the emoji → Ionicons migration |
| 11 | New TD (BE) | MEDIUM | BE | 0.5 day | §1.5 narrow the realtime publication / column filter |
| 12 | New TD (FE) | MEDIUM | FE | 0.5 day | §6.2 promote TD-107 to launch blocker; show "בקרוב" alerts |

---

## 11. False positives & rejected agent claims

The audit explicitly **does not** carry forward the following items that the parallel agents proposed but the auditor disproved on re-read:

| Agent claim | Why rejected |
| ----------- | ------------ |
| "Exposed Supabase anon key in `.env` is CRITICAL" | The key in `.env` is a Supabase **publishable** key (`sb_publishable_*`), the public counterpart of the anon JWT. It is *designed* to ship in client bundles. RLS is the protection model. Re-classed as INFO (§4.1). |
| "Image upload not awaited — post created before images upload" | `(tabs)/create.tsx:60-75` awaits `Promise.all` of the upload tasks, **and** the Publish button is disabled while `uploadingCount > 0` (line 110). Agent misread the flow. The real upload-related issue is §3.8 (orphan cleanup on partial failure). |
| "Hardcoded Supabase URL allows MITM" | TLS + the public publishable key model is Supabase's documented threat model. Cert pinning is a defense-in-depth, not a critical fix. |
| "Web `localStorage` XSS risk" | Important *if* there were inputs that are HTML-rendered. Currently all user text is rendered through `<Text>` (RN-Web escapes). Listed in §4.5 as "fix the bio sanitization first." |
| "AsyncStorage on Android plaintext is CRITICAL" | Documented decision (EXEC-1). Re-classed as MEDIUM (§4.7) with an upgrade path. |
| "PKCE flow not implemented" | `client.ts` configures `flowType: 'pkce'`; `signInWithGoogleUseCase` uses `expo-web-browser` openAuthSession + code exchange — PKCE is in effect. The real concern (§4.3) is `state` validation, not PKCE itself. |
| "FR-AUTH-006 AC1 breached-passwords check missing" | Already tracked (TD-2). Listing it would double-count. |

---

## 12. Process recommendations

- **Promote TD-39, TD-11, TD-107 to launch blockers** in `TECH_DEBT.md` ahead of P0.5. Each is "schema or UI looks done, but the privacy/safety story isn't true."
- **Add a "Mapped to SRS" enforcement hook** (commit-msg hook or PR template required-section) — manual discipline is already 80% there.
- **Stand up an adapter-layer vitest target** (TD-50). The chat adapter is about to land; shipping it untested compounds the existing posts adapter gap.
- **Add a `pnpm sec:check` script** that greps for `sb_secret_`, `service_role`, and any non-`EXPO_PUBLIC_` env access in `apps/mobile/`. Cheap defense against accidental key inclusion.
- **Treat the realtime publication as part of the privacy contract.** The current `0007_users_realtime_publication.sql` was the right call to ship realtime cheaply, but it bypasses the careful column-level reasoning in `0001`/`0006`. Document the column allowlist next to the publication.
- **Consider a quarterly RLS regression suite.** The `is_blocked`, `is_following`, `is_post_visible_to` matrix has 4 dimensions × 5 statuses — that's 80 cases. A SQL test harness that enumerates them would close §1's whole class of risks.

---

---

# Round 2 — PRD compliance & follow-up audit (2026-05-10)

A second pass was run after Round 1 with five new agents focused on areas the first pass touched lightly: **(13) PRD business-rules compliance**, **(14) navigation & user-flow correctness**, **(15) RLS / triggers second deep-dive**, **(16) per-screen UI/UX correctness**, **(17–21) cross-cutting concerns** (auth state machine, idempotency, rate-limit, time, mobile config, web build). The document baseline (PRD 1.3 with all 33 contradictions resolved) was treated as gospel.

**What Round 2 changed about Round 1's picture:**

- The chat-realtime infrastructure is **already shipped**: `supabase/migrations/0010_seed_super_admin.sql`, `0011_chat_helpers.sql`, plus `app/packages/infrastructure-supabase/src/chat/{SupabaseChatRepository,SupabaseChatRealtime}.ts` and seven application use-cases under `app/packages/application/src/chat/`. **TD-15 in `TECH_DEBT.md` is now stale** — chat is not a P0.5 prospect, it is live work currently being audited. Treat the chat findings (§18, §19) as live, not theoretical.
- Round 1's "guest preview shows 6 posts" is **withdrawn** — the use case fetches 6 and `selectGuestPreviewPosts` slices to 3.
- Round 1's "URL fallback / no PKCE" assumption is intact — but Round 2 surfaces a separate enumeration vulnerability via `mapAuthError` (see §17.2) that is independent of OAuth.

---

## 13. PRD business-rules compliance

> All R-MVP-* identifiers reference `docs/SSOT/PRD_MVP_CORE_SSOT/07_Business_Rules.md`. Status: ✅ Met / ⚠️ Partial / ❌ Violated. Round 1 already covered general code/spec drift; this section is strictly PRD-rule-by-rule.

### 13.1 Headline PRD violations

| Rule | Status | Severity | Evidence |
| ---- | ------ | -------- | -------- |
| R-MVP-Items-12 (3 visibility levels) | ❌ | CRITICAL | See §16.1 — `VisibilityChooser` only renders 2 of 3 options. |
| R-MVP-Privacy-13 (privacy_mode Private→Public auto-approves pending follow_requests) | ❌ | HIGH | See §15.4. |
| R-MVP-Privacy-13 (privacy_mode change does NOT change posts retroactively — must be guarded) | ❓ | MEDIUM | Schema doesn't restrict client UPDATE on `posts.visibility` to upgrades only — guarded by trigger but not by GRANT. Re-verify. |
| R-MVP-Privacy-9 (visibility upgrade-only post-publish) | ✅ [verified] | — | Trigger `posts_visibility_upgrade_check()` in `0002_init_posts.sql:65-95` enforces `canUpgradeVisibility()`-equivalent rank logic. |
| R-MVP-Privacy-1 (NO GPS / coordinates) | ✅ [verified] | — | No `latitude`/`longitude` columns on `posts`; no `expo-location` import in mobile. |
| R-MVP-Items-1 (image mandatory for Give, optional for Request) | ✅ [verified] | — | `CreatePostUseCase.ts` enforces `mediaAssets.length === 0` only when `type === 'Give'`. |
| R-MVP-Items-13 (city + street + number mandatory for both Give AND Request) | ✅ [verified] | — | `(tabs)/create.tsx:115-120` requires all three regardless of `isGive`. |
| R-MVP-Items-14 (`OnlyMe` posts count toward 20 quota AND in internal counter, NOT in public counter) | ⚠️ [needs-verify] | HIGH | Active-cap trigger uses live COUNT (correct); `active_posts_count_for_viewer()` exists, but TD-39 already shows that non-owner viewers get the raw `_internal` value — verify the public counter excludes `OnlyMe` cleanly. |
| R-MVP-Items-15 (KPI math: `items_given_count = closed_delivered + deleted_no_recipient`; `items_received_count = closed_delivered as recipient`) | ⚠️ [needs-verify] | MEDIUM | Counter trigger logic in `0006_init_stats_counters.sql` uses these values; full path to KPI emission isn't yet wired (FR-CLOSURE deferred). |
| R-MVP-Items-7 (5+ reopens = Suspect) | ⚠️ [verified] | MEDIUM | Constant `REOPEN_SUSPECT_THRESHOLD=5` in domain, predicate `isReopenSuspect()` exists, but the trigger that fires the moderation queue entry (`posts_after_reopen_check_queue` in `0005_init_moderation.sql`) only fires on `update of reopen_count`, and the `reopen_count` column is **client-writable** (see §15.5) — abusable. |
| R-MVP-Items-5 (300-day expiry + 7-day pre-expiry notification) | ❌ [verified] | MEDIUM | `POST_EXPIRY_DAYS=300` constant + `posts.delete_after` column exist, but no cron / Edge function / trigger expires posts; no 7-day pre-notification job exists. |
| R-MVP-Items-6 (`deleted_no_recipient` 7-day reopen window) | ❌ [verified] | MEDIUM | Same — no scheduled job to hard-delete `deleted_no_recipient` posts after 7 days. |
| R-MVP-Profile-7 (feed is chronological only, NO follow boost, NO "from someone you follow" tag) | ✅ [probable] | — | Round 2 navigation agent confirmed no follow-tag in `PostCardGrid`. |
| R-MVP-Profile-8 (NO "people I follow" filter in MVP) | ✅ [probable] | — | Filter modal does not include this option. |
| R-MVP-Privacy-12 (rejection silent + 14-day cooldown) | ✅ [verified] | — | `0003_init_following_blocking.sql:299-318` enforces both: no notification on reject, 14-day cooldown. |
| R-MVP-Chat-2 (text only — no images, voice, location in chat) | ✅ [verified] | — | `0004_init_chat_messaging.sql` schema for messages has only `body` + `system_payload`. |
| R-MVP-Chat-4 (auto first message verbatim copy) | ❓ | LOW | `BuildAutoMessageUseCase.ts` exists; verify the exact Hebrew string matches PRD's "היי! ראיתי את הפוסט שלך על [כותרת]. מעוניין/ת לדעת עוד." |
| R-MVP-Chat-6 (suggesting payment in chat = automatic report) | ❌ [verified] | MEDIUM | No payment-detection logic anywhere (regex / NLP / AI). PRD also defers algorithmic detection (R-MVP-Items-10 P2 #25 same direction), so this is community-driven only — but the spec wording "automatic report" implies more than community-driven; either rewrite the rule or implement a stub. |
| R-MVP-Profile-6 (bio max 200 chars + NO external URLs) | ⚠️ | MEDIUM | Length cap in DB (`0001_init_users.sql:56-57`); URL filter is documented as missing in TD-28 — this PRD rule is a hard MUST, escalate from Opportunistic. |

### 13.2 Out-of-scope features — leak check

The Round 2 PRD agent inspected the codebase for any of `08_Out_of_Scope_and_Future.md`'s explicitly-deferred features and found **no leaks**: no Likes, Comments, Bookmarks, Group chats, AI chat-bot, Heatmap, "Friends only" feed toggle, Discover-people screen, image attachments in chat, mutual-follow gates, and no money-world business logic (the Money tab is a passthrough to jgive.com per D-16). **Result: no scope creep detected.**

---

## 14. Navigation, user-flow & screen-mapping audit

### 14.1 [HIGH] [verified] `VisibilityChooser` is missing the third radio entirely

- **Evidence:** `apps/mobile/src/components/CreatePostForm/VisibilityChooser.tsx:6-12`. The component is typed `value: 'Public' | 'OnlyMe'` and the inline comment reads `// FollowersOnly gated on Private profile (P2.4); excluded here.`
- **PRD rule:** R-MVP-Items-12 — **3** visibility levels. The PRD's Hebrew copy mandates the third row to be present even when disabled, with the tooltip "*זמין כשפרופיל פרטי. הגדרות → פרטיות.*"
- **Why it matters:** A user on a Private profile literally has no way to publish a `FollowersOnly` post — the entire feature is unreachable through the UI. The DB-side `posts.visibility` enum and RLS predicates support it; the form just doesn't expose it.
- **Fix:** Add the `FollowersOnly` row, query `users.privacy_mode` to compute `disabled = privacy_mode !== 'Private'`, render the tooltip in the disabled state.

### 14.2 [HIGH] [needs-verify] Settings → "שם משתמש ופרטים" row is dead — should route to `/edit-profile`

- **Evidence:** `apps/mobile/app/settings.tsx:99` — `onPress={() => {}}`. Round 2 navigation agent flagged this and proposed `router.push('/edit-profile')`.
- **Why it matters:** This duplicates TD-107's complaint but with a specific recommended fix that can land independently in 5 minutes.
- **Fix:** `onPress={() => router.push('/edit-profile')}`. Removes one entry from TD-107's seven dead handlers.

### 14.3 [HIGH] [probable] `chat/index.tsx` renders a back button in the header but is reachable from the top-bar

- **Evidence:** Per Round 2 navigation agent's read of `chat/index.tsx:5-20` — header `useLayoutEffect` adds a back button. Per `06_Navigation_Structure.md:6.2.1`, top-bar entry-points (Chat, Settings) should not duplicate native back navigation.
- **Why it matters:** Redundant UI, awkward back-stack interaction.
- **Fix:** Remove `headerLeft` from `chat/index.tsx`'s `useLayoutEffect`; let native stack handle back.

### 14.4 [HIGH] [needs-verify] `chat/[id]` doesn't pre-check chat existence before subscribing

- **Evidence:** Per Round 2 navigation agent's read — `useLocalSearchParams.id` is fed straight to `startThreadSub` without a `findById` guard.
- **Why it matters:** A deep link to `/chat/<deleted-or-unauthorized-id>` opens a thread page that subscribes to a never-fires channel. The spinner spins forever; the empty state never resolves.
- **Fix:** Wrap with a one-shot `chatRepo.findById(chatId)`; render `<EmptyState>` if null before subscribing.

### 14.5 [MEDIUM] [verified] Soft-gate redirect destroys the in-flight publish payload

- **Evidence:** Per Round 2 navigation agent — `(tabs)/create.tsx` calls `requestSoftGate(() => publish.mutate())` then `router.replace('/(onboarding)/basic-info')`. The router replace clears the back stack; if the user completes onboarding, the form fields are gone.
- **Why it matters:** A user who fills out a thoughtful Give post, then triggers the soft-gate, loses the entire post.
- **Fix:** Snapshot the form into AsyncStorage with a `draftPostKey` before `router.replace`; on onboarding completion, hydrate `(tabs)/create` from the snapshot.

### 14.6 [MEDIUM] [probable] Filter button on the home feed is non-functional

- **Evidence:** Per Round 2 navigation agent — the badge count UI exists but `onPress` does not open a filter modal.
- **Why it matters:** Looks broken / shipped half-built. R-MVP-Privacy-8 ("save last filter") cannot be honored if the filter UI itself is non-functional.
- **Fix:** Either implement the filter modal (use `filterStore` which already exists) or hide the button until P1.2 ships.

### 14.7 [MEDIUM] [probable] Apple SSO + Phone OTP are placeholders that route to email sign-in (TD-24)

- **Evidence:** TD-24 — known.
- **Why it matters elevates here:** R-MVP-Core-8 says "Sign in with Apple is **mandatory on iOS** (App Store guidelines)". The placeholder is functional for sign-in (it works, just via email), but **shipping to the App Store with Apple SSO as a placeholder will fail review**. Re-classify TD-24 from "P3.2" deferred to **launch blocker for the iOS submission**.

### 14.8 [LOW] [probable] Search tab CTA reads "חזור לעמוד הבית" — sounds like an escape, not a navigation

- **Evidence:** `(tabs)/search.tsx` — spec says "placeholder, CTA back to Home" but copy is "go back" rather than "discover on Home".
- **Fix:** Reword to "גלה בפיד הראשי" or similar.

### 14.9 [LOW] [verified] Onboarding photo hint promises "אפשר להחליף תמונה מאוחר יותר בהגדרות" but Settings has no avatar editor

- **Evidence:** Per Round 2 screen agent — the hint is in `(onboarding)/photo.tsx`. The actual editor is on `/edit-profile`, reached from Profile, not Settings.
- **Fix:** Reword to "בפרופיל" or wire a Settings → Avatar entry.

---

## 15. RLS, triggers & SECURITY DEFINER — second deep dive

### 15.1 [CRITICAL] [verified] `column_grants` on `reports.resolved_at` / `reports.resolved_by` are loose

- **Evidence:** `0005_init_moderation.sql:690-691`
  ```
  grant update (status, resolved_at, resolved_by) on public.reports to authenticated;
  ```
- **Why it matters:** RLS policy gates UPDATE to `is_admin(auth.uid())`, but the column grant gives ANY authenticated user the *capability* to write these columns. If a future RLS revision relaxes the predicate (e.g., a new "self-resolution" feature for low-severity reports), there's no column-level safety net. More immediately: the BEFORE/AFTER triggers manage these columns server-side; client writes are spurious and could clobber admin-set values.
- **Fix:** `grant update (status) on public.reports to authenticated;` — drop the two server-managed columns.

### 15.2 [CRITICAL] [verified] `active_posts_count_for_viewer(uuid, uuid)` and `has_blocked(uuid, uuid)` are PostgREST-callable by `anon`

- **Evidence:** `0006_init_stats_counters.sql:346-347` grants `active_posts_count_for_viewer` to `anon, authenticated`. `has_blocked` in `0004_init_chat_messaging.sql:83-97` has no explicit `revoke from public` and so inherits default EXECUTE-to-PUBLIC.
- **Why it matters:** Same shape as Round 1 §1.2 — RPC enumeration. `active_posts_count_for_viewer(<owner>, <viewer>)` lets an attacker probe follower-relationship presence by observing count differentials. `has_blocked` lets an attacker probe directional block edges.
- **Fix:** `revoke execute on function ... from public, anon;` then `grant execute ... to authenticated;` for both.

### 15.3 [CRITICAL] [verified] `rpc_get_or_create_support_thread()` has a read-then-insert race

- **Evidence:** `0011_chat_helpers.sql:78-86`
  ```
  select * into v_chat from public.chats where participant_a = v_a and participant_b = v_b;
  if found then return v_chat; end if;
  insert into public.chats (participant_a, participant_b, is_support_thread)
  values (v_a, v_b, true) returning * into v_chat;
  ```
- **Why it matters:** Two concurrent calls (e.g., user double-taps "Report Issue" or two devices submit simultaneously) both find no row, both attempt insert, the unique `(participant_a, participant_b)` constraint catches the second one and the function raises `unique_violation`. The caller gets a generic Postgres error, not a typed "already-exists" — and the user sees "couldn't open support" while the chat actually exists.
- **Fix:** Replace lines 78-86 with `insert ... on conflict (participant_a, participant_b) do update set participant_a = excluded.participant_a returning *` — atomic upsert.

### 15.4 [HIGH] [verified] No trigger to auto-approve pending follow_requests on `Private → Public` transition

- **Evidence:** Round 2 RLS agent searched for any trigger on `users.privacy_mode` — there is no `users_after_privacy_mode_change` function in any migration. The `follow_requests_on_status_change` trigger handles status transitions on the request itself (lines 339-341 of 0003), but nothing reacts to a user-side privacy toggle.
- **PRD rule:** R-MVP-Privacy-13 — *"מעבר פרטי → פומבי **מאשר אוטומטית** את כל בקשות העקיבה הממתינות ומפיק התראה למבקשים."*
- **Why it matters:** Pending follow requests will sit forever even after the requested user becomes Public, creating UX dead-ends and breaking the spec's "no manual approval needed once you're Public" promise.
- **Fix:** Add an `after update of privacy_mode on public.users` trigger that, when `old.privacy_mode = 'Private' AND new.privacy_mode = 'Public'`, updates all pending `follow_requests where target_id = new.user_id` to `status = 'accepted'` and lets the existing accept-side-effect trigger handle the rest.

### 15.5 [HIGH] [verified] `posts.reopen_count` is in the client-writable column grant

- **Evidence:** `0002_init_posts.sql:321-325` — the `grant update` on `posts` for authenticated users includes `reopen_count`.
- **Why it matters:** `reopen_count` is the input to the moderation-queue entry trigger (`posts_after_reopen_check_queue` in 0005, fires at `>= 5`). A post owner can `update posts set reopen_count = 5` on their own post and either (a) self-flag for admin review (waste of admin time) or (b) by setting low values, hide a real reopen-spam pattern from the queue.
- **Fix:** Remove `reopen_count` from the column grant. Increment only via SECURITY DEFINER trigger (which already exists on the recipients-DELETE path).

### 15.6 [MEDIUM] [verified] Suspended users can still INSERT posts, chats, messages

- **Evidence:** None of the INSERT policies (`posts_insert_self` in 0002, `chats_insert_self` in 0004, `messages_insert_user` in 0004) check `users.account_status`. They only check `auth.uid() = owner_id` (or participant equivalence).
- **Why it matters:** A user serving a 7-day temp suspension (`suspended_temp` per R-MVP-Privacy-5) can still create posts and send messages; existing posts are hidden by `is_post_visible_to`, but new posts go straight in and would be invisible only because of visibility predicates downstream — they still consume quota and pollute the moderation pipeline.
- **Fix:** Extend each INSERT policy with `and exists (select 1 from public.users u where u.user_id = auth.uid() and u.account_status = 'active')`. Or wrap the check in a `SECURITY DEFINER` helper `is_active_member(auth.uid())`.

### 15.7 [MEDIUM] [probable] Realtime publication on `users` exposes new sensitive columns added in 0005

- **Evidence:** `0007_users_realtime_publication.sql:16` adds `public.users` to `supabase_realtime`. `0005_init_moderation.sql` adds `false_reports_count`, `false_report_sanction_count`, `account_status_until` to the same table. Per Round 1 §1.5, the publication has no column filter.
- **Why it matters:** An approved follower of a Private user gets realtime UPDATE events including the new sanction-related columns. They can infer a target was reported, was sanctioned, or had their cooldown extended — privacy violation.
- **Fix:** Either drop `users` from the publication and broadcast scoped projections via a separate `users_public_view`, or use the column-filter syntax in PostgreSQL 15+ to restrict the publication to safe columns.

### 15.8 [MEDIUM] [verified] Self-block / self-follow edge cases are guarded twice (defense-in-depth)

- `0003_init_following_blocking.sql:18` (CHECK on follow_edges) + trigger `follow_edges_validate_before_insert()` — both guard.
- `0003_init_following_blocking.sql:67` (CHECK on blocks) + RLS WITH CHECK clause — both guard.
- **Verdict:** Good. Listed only so the reader notes the existing safety.

### 15.9 [MEDIUM] [verified] `messages.sender_id ON DELETE SET NULL` leaves message body intact

- **Evidence:** `0004_init_chat_messaging.sql:41-44`. Comment notes this is intentional for thread continuity.
- **Why it matters:** A deleted user's messages remain readable to the counterparty under their original body. There is no anonymization (no body replacement, no `[user deleted]` placeholder). This is documented intent but worth flagging because it conflicts with the spirit of R-MVP-Privacy-6 ("delete all my chats from my side").
- **Fix:** Either (a) accept and document explicitly in the PRD, or (b) add a trigger that replaces `body` with a localized placeholder on user delete.

### 15.10 [MEDIUM] [verified] `account_status_until` window is not auto-cleared

- **Evidence:** `0005_init_moderation.sql:21` defines the column. No trigger / cron sets `account_status` back to `active` when `account_status_until < now()`.
- **Why it matters:** A user serving a 7-day suspension stays suspended forever (until manually unblocked) because nothing transitions them back. Defeats the "temp" in `suspended_temp`.
- **Fix:** Add a `BEFORE SELECT/INSERT/UPDATE` SECURITY DEFINER guard, or a daily Edge Function, that does `update users set account_status = 'active', account_status_until = null where account_status in ('suspended_temp', 'suspended_for_false_reports') and account_status_until < now()`.

### 15.11 [MEDIUM] [verified] `inject_system_message(uuid, jsonb, text)` is granted to `authenticated` without admin-check

- **Evidence:** `0005_init_moderation.sql:702`. The function is SECURITY DEFINER.
- **Why it matters:** Any authenticated user can craft an `inject_system_message(<some-chat-id>, '{"forged":"message"}', 'system')` call to inject a fake system message into any chat they can find an ID for. The schema's `kind = 'system'` constraint is the only thing they bypass.
- **Fix:** Either revoke the grant entirely (the function should only be called from triggers, not RPC) or add `if not is_admin(auth.uid()) then raise exception 'admin_only' end if;` at the top.

### 15.12 [MEDIUM] [needs-verify] `find_or_create_support_chat` (in 0005, separate from the `rpc_*` variant in 0011)

- **Evidence:** `0005_init_moderation.sql:271-302` — also a read-then-insert pattern.
- **Why it matters:** Same race shape as §15.3 if it's reachable from PostgREST RPC. Verify whether it's called only from triggers (safe) or also exposed.
- **Fix:** Same as §15.3 — atomic upsert.

### 15.13 [MEDIUM] [needs-verify] `recipients` table missing UPDATE policy + missing trigger to flip `posts.status = 'closed_delivered'`

- **Evidence:** `0002_init_posts.sql:161-165, 252-280` — INSERT and DELETE policies present, no UPDATE policy. No trigger fires on `recipients` insert to update the linked post's status.
- **Why it matters:** When closure ships (P0.6), the application layer must set `posts.status = 'closed_delivered'` in the same transaction as `INSERT recipients`. If only one of the two writes succeeds, the data is half-closed (recipient row exists but post is still `open`, or post is `closed_delivered` but no recipient). The atomic guarantee is only available via a trigger.
- **Fix:** Add `recipients_after_insert_close_post()` SECURITY DEFINER trigger to atomically set the post status.

### 15.14 [LOW] [verified] `is_post_visible_to()` is `STABLE` and uses subquery — correct, but called per-row in feed RLS

- **Evidence:** `0003_init_following_blocking.sql:124-148` — STABLE, includes a subquery on `recipients` for the closed_delivered branch.
- **Why it matters:** Per-row evaluation in a large feed query is expensive. PostgREST's planner should hoist STABLE functions but compound subqueries inside RLS may not get inlined.
- **Fix:** Profile the EXPLAIN output on a 10k-post feed query; if hot, consider a materialized view of `(post_id, viewer_id) → visible` for popular viewers, refreshed nightly.

### 15.15 [LOW] [verified] `cities` table has RLS-on but `select using (true)` + grant to anon — RLS is theatrical

- **Evidence:** `0001_init_users.sql:14, 17-18, 291`.
- **Why it matters:** Cosmetic issue — the table is reference data, intentionally public. But enabling RLS with a permissive policy is misleading.
- **Fix:** Either disable RLS on `cities` (clearer intent) or add a comment noting the RLS-enabled+permissive-policy combination is intentional.

---

## 16. Per-screen UI/UX correctness

### 16.1 [CRITICAL] [verified] `VisibilityChooser` excludes `FollowersOnly` entirely

- See §14.1. Same finding viewed from the screen-component angle.

### 16.2 [HIGH] [probable] `PostImageCarousel` counter chip uses `left: spacing.sm` — appears off-image in RTL

- **Evidence:** Per Round 2 screen agent — `PostImageCarousel.tsx:30` positions the counter with `position: 'absolute', left: spacing.sm`.
- **Why it matters:** With `I18nManager.forceRTL(true)`, `left` does NOT flip automatically (unlike `marginLeft`). The counter "1 / 5" lands at the screen-left edge instead of image-left. Visually broken.
- **Fix:** Use `start: spacing.sm` (RN's logical-edge property) or `[I18nManager.isRTL ? 'right' : 'left']: spacing.sm`.

### 16.3 [HIGH] [verified] Type-toggle in `(tabs)/create.tsx` uses literal `🔍` and `🎁` emoji

- See Round 1 §4.6. Same — emoji literals on iOS-26 simulator render as tofu (TD-109's whole reason for being).
- **Status:** Already on the list; raising visibility because Round 2 confirms it.

### 16.4 [HIGH] [probable] Multiple icon-only TouchableOpacity wrappers lack `accessibilityLabel`

- **Evidence:** Per Round 2 screen agent — `post/[id].tsx:136-140` (Send Message button uses `💬` literal as label), `chat/[id].tsx:98-109` (more-menu ellipsis), `PhotoPicker.tsx:35-42` (per-thumbnail remove button), Settings switches (`settings.tsx:105-130`).
- **Why it matters:** Screen-reader users hear the icon name (or nothing) instead of the action.
- **Fix:** Audit pass — every `TouchableOpacity` wrapping an `Ionicons` must declare `accessibilityLabel` and `accessibilityRole="button"`. The sub-task is mechanical (~1 hour).

### 16.5 [HIGH] [probable] Create-post form clears all fields on publish error

- **Evidence:** Per Round 2 screen agent — `(tabs)/create.tsx:80-110` (the `publish` mutation onError) doesn't preserve the form values; if the alert is dismissed, the form is reset.
- **Why it matters:** A user who hit publish with a 504 loses the entire post to a re-type cycle. Particularly painful for Request posts with long descriptions.
- **Fix:** Don't clear state in `onError`. Only clear in `onSuccess`. Add a draft-snapshot to AsyncStorage as a belt-and-braces.

### 16.6 [MEDIUM] [verified] Soft-gate success alert uses literal emoji `✅`

- **Evidence:** `(tabs)/create.tsx:102` — `Alert.alert('✅ הפוסט שלך פורסם!', ...)`. Same iOS-26 tofu risk as TD-109.
- **Fix:** Drop the emoji or render an `Ionicons name="checkmark-circle"` in a custom modal.

### 16.7 [MEDIUM] [probable] Chat send button doesn't trim whitespace

- **Evidence:** Per Round 2 screen agent — `chat/[id].tsx:114-115, 139` — `sendDisabled` checks raw input length, not trimmed.
- **Why it matters:** A user can send a message containing only spaces.
- **Fix:** `sendDisabled = input.trim().length === 0 || input.length > MESSAGE_MAX_CHARS`.

### 16.8 [MEDIUM] [probable] Donations time composer also doesn't trim

- Same shape as §16.7. Same fix.

### 16.9 [MEDIUM] [probable] Sign-in / sign-up don't validate email format client-side

- See Round 1 §3.3 — the use case has a regex but it's permissive. Round 2 adds: the screens themselves let the user attempt an invalid email and only then surface a backend error.
- **Fix:** Add an inline format check on the screens OR (preferred) drop client-side validation entirely and rely on a typed Supabase error code.

### 16.10 [MEDIUM] [probable] Edit Profile doesn't warn of unsaved changes on Back

- **Evidence:** Per Round 2 screen agent — `edit-profile.tsx:65-75` — back button discards.
- **Fix:** Track a `dirty` flag; on Back, show a confirm `Alert`.

### 16.11 [MEDIUM] [probable] Photo picker doesn't validate permissions before launching

- **Evidence:** Per Round 2 screen agent — `PhotoPicker.tsx` launches camera/gallery without a pre-check.
- **Status:** TD-110 mentions the avatar/upload helpers got the permission UX, but PhotoPicker may have been missed.
- **Fix:** Mirror the avatarUpload permission pattern (canAskAgain check + Settings deep link on permanent denial) in PhotoPicker.

### 16.12 [MEDIUM] [probable] Many screens lack a loading skeleton; users see blank during fetch

- `chat/[id].tsx`, `user/[handle].tsx`, `edit-profile.tsx`, post detail image carousel — all flashed as "blank then content" without a skeleton or spinner.
- **Fix:** A shared `<ScreenLoading />` component used while the primary `useQuery` is `isPending`.

### 16.13 [LOW] [probable] Hebrew copy inconsistencies in chat menu Alert

- "פעולות" (title) → "חסום" / "דווח על השיחה" / "ביטול" — no periods on options.
- **Fix:** Cosmetic. Pick a convention.

### 16.14 [LOW] [probable] Donation tiles don't set `activeOpacity` on TouchableOpacity

- **Fix:** `activeOpacity={0.7}` on each tile.

### 16.15 [LOW] [verified] Chat list mock data — verify no PII ships

- **Evidence:** TD-15 says chat is mock-backed in TECH_DEBT, but Round 2 verified the actual chat infrastructure is shipped and live. The MOCK_CHATS constant in `chat/index.tsx` may now be dead code or may still ship as fallback. Confirm and remove.
- **Fix:** If `MOCK_CHATS` is still referenced, remove it; if it's already dead, its import is a lint flag.

---

## 17. Auth state machine, sessions, and identity errors

### 17.1 [HIGH] [verified] `RestoreSession` does not check `users.account_status`

- **Evidence:** Grep on `app/packages/application/src/auth/` for `account_status` returns no matches. `RestoreSessionUseCase.ts` only validates `session.expiresAt > nowSec`.
- **Why it matters:** A user suspended (`suspended_temp`, `suspended_perma`) on the server side stays signed in across app restarts. Their access token is valid, RLS still admits their reads. Combined with §15.6 (no INSERT policy guard), a suspended user can also write — defeating the entire suspension model (R-MVP-Privacy-5).
- **Fix:** After `RestoreSession` succeeds, fetch the user row and verify `account_status === 'active'`. If not, immediately call `signOut`. Same check on every fresh sign-in path.

### 17.2 [HIGH] [verified] `mapAuthError` distinguishes `invalid_credentials` from `email_already_in_use`

- **Evidence:** `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts:91-95`
  ```ts
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return new AuthError('invalid_credentials', err.message, err);
  }
  if (msg.includes('already registered') || msg.includes('already in use') || status === 422) {
    return new AuthError('email_already_in_use', err.message, err);
  }
  ```
- **Why it matters:** A scripted attacker can probe the auth endpoint with any email; the distinct error codes returned to the client are an enumeration oracle. Standard practice: return a single generic `authentication_failed` for all sign-in failures and a single generic "if this email is registered, you'll receive an email" for sign-up.
- **Fix:** Collapse both error paths to a unified `authentication_failed` code on sign-in. On sign-up, do not differentiate "exists" — always show "אם זה לא היה מייל קיים, ישלח אישור" or similar.

### 17.3 [HIGH] [verified] No state-machine guard on `onboarding_state` transitions

- **Evidence:** `CompleteBasicInfoUseCase.ts` calls `setOnboardingState('pending_avatar')` without verifying `current === 'pending_basic_info'`. `CompleteOnboardingUseCase.ts` similarly.
- **Why it matters:** A racing client (or a UI bug) can jump straight from `pending_basic_info` to `completed`, bypassing the avatar step entirely. The DB column is just an enum with no transition CHECK.
- **Fix:** Each use case asserts the expected source state before writing; reject with a typed `OnboardingError('illegal_transition')` otherwise. A DB-level CHECK using a `before update` trigger is also possible.

### 17.4 [MEDIUM] [verified] `onboarding_state = 'completed'` can be rolled back

- **Evidence:** Same column, no `WHERE old.onboarding_state <> 'completed'` guard on the column update grant.
- **Why it matters:** A bug in Settings → "Reset onboarding" (which the screen agent noted exists at `settings.tsx:44-46`) could send a completed user back to onboarding and lose the back-stack. Round 2 navigation agent flagged the related TabBar visibility race.
- **Fix:** Either remove the reset-onboarding option, or wrap the state-write in a SECURITY DEFINER admin RPC + restrict the column grant.

### 17.5 [MEDIUM] [verified] Token expiry checked at cold start, not at every RPC

- **Evidence:** `RestoreSession.ts:15-18`. The Supabase client auto-refreshes on its own schedule, but a token that expires mid-action goes through one refresh round-trip; if the refresh fails the user sees a generic `Error: invalid_jwt`.
- **Fix:** Subscribe to `supabase.auth.onAuthStateChange('TOKEN_REFRESHED' | 'SIGNED_OUT')` and route to Welcome on `SIGNED_OUT`.

### 17.6 [MEDIUM] [verified] Sign-out doesn't clear React Query cache

- **Evidence:** Round 2 cross-cutting agent — sign-out flows clear `authStore` and call `chatStore.resetOnSignOut()`, but no `queryClient.clear()`.
- **Why it matters:** On a shared device (rare, but possible in family contexts), the next sign-in immediately sees the previous user's cached posts/profile/feed for a frame before the new fetch lands. PII leak window.
- **Fix:** Call `queryClient.clear()` in the sign-out handler before resetting auth state.

---

## 18. Concurrency, idempotency, and atomicity (chat-heavy)

### 18.1 [HIGH] [verified] `SendMessageUseCase` has no idempotency key

- **Evidence:** `app/packages/application/src/chat/SendMessageUseCase.ts` + repository `sendMessage` — no client-generated key. `messages` table has no `client_request_id` column.
- **Why it matters:** Network retry on a flaky connection: a 504 after the server committed = a duplicate row. The optimistic-update reconciliation in `chatStore` matches by body, which works for distinct strings but couples the wrong rows when a user sends the same message twice intentionally.
- **Fix:** Add `messages.client_request_id uuid unique`; client generates it; upsert with `on conflict do nothing returning *`.

### 18.2 [HIGH] [verified] `SupabaseChatRepository.findOrCreateChat` is read-then-insert

- **Evidence:** `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts:34-62`. Sister bug to §15.3 — the application-layer version of the same pattern.
- **Fix:** Same — `insert ... on conflict (participant_a, participant_b) do update set ... returning *`.

### 18.3 [MEDIUM] [probable] `ReportChatUseCase` relies on a 24h dedup trigger but no idempotency key

- **Evidence:** `0005_init_moderation.sql:350-359` — dedup is "no duplicate report by same reporter against same target in 24h", which is *temporal*. A retry within 24h returns "already reported" with no way to know if it's the *same* report or a fresh one.
- **Fix:** Same pattern — add `reports.client_request_id uuid unique` and upsert.

### 18.4 [MEDIUM] [probable] Block / unblock and follow / unfollow toggles have no UI loading lock

- **Evidence:** `BlockUserUseCase` is 13 lines and only checks `self_block_forbidden`. A double-tap on the block button fires twice; the unique constraint catches the second insert with a Postgres error that bubbles out as a generic "couldn't block" alert.
- **Fix:** Add `isLoading` guard to the button; disable while pending.

### 18.5 [MEDIUM] [probable] Chat `applyIncomingMessage` may double-add on subscription duplication

- **Evidence:** Round 2 cross-cutting agent — `SupabaseChatRealtime.subscribeToChat` + `chatStore.startThreadSub` reservation pattern (lines 147-173 of chatStore). The reservation is in Zustand — across multiple test runs or HMR reloads, both subscriptions can land.
- **Fix:** Track subscription instances by ID; assert exactly one is alive per chat.

---

## 19. Rate limiting

### 19.1 [HIGH] [verified by absence] No rate limit anywhere in the codebase

- **Evidence:** Round 2 cross-cutting agent searched migrations and infrastructure for any rate-limit trigger / table / function — none found. Supabase auth endpoints have built-in limits, but custom endpoints (RPCs, Storage uploads, follow/block churn, message send, report submission) do not.
- **Why it matters:** Spam-able vectors:
  - **Send message:** A script can flood a chat with thousands of messages.
  - **Reports:** A script can file thousands of reports against thousands of targets, polluting moderation queue.
  - **Image upload:** Storage quota / billing exposure.
  - **Follow / unfollow:** Audit-log noise + counter trigger churn.
- **Fix:** A small `rate_limits` table keyed on `(user_id, action, window_start)` + a SECURITY DEFINER function `enforce_rate_limit(action, window_seconds, max_count)` called from each affected trigger. Defaults: messages 20/min, reports 5/hr, follow churn 30/min, image upload 50/day.

---

## 20. Time, dates, presence

### 20.1 [MEDIUM] [verified] Mixed timestamp formats

- **Evidence:** `session.expiresAt` is unix seconds; `messages.created_at` is ISO 8601 string; `chatStore` does `Date.parse(...)` to normalize. Footgun.
- **Fix:** Pick one (unix milliseconds is the JS-friendly choice) and convert at every adapter boundary.

### 20.2 [MEDIUM] [verified] No user-presence column, but the realtime publication can leak presence anyway

- See §15.7 — counter updates on the `users` row are observable in real-time. Even without a `last_seen_at` column, an attacker subscribed to a user's row sees `followers_count` change as that user follows others, inferring activity.
- **Fix:** Move the entire publication strategy to a curated public view.

### 20.3 [LOW] No timezone coercion — Israel-specific dates

- 7-day suspensions, 14-day cooldowns, 30-day false-report windows, 300-day post lifetime — all use `now()` (UTC). A user in IDT/IST sees a "7-day" suspension that ends at 03:00 their time. Cosmetic.

---

## 21. Mobile config, web build, dependency hygiene, docs

### 21.1 [MEDIUM] [probable] iOS permission strings hardcoded in Hebrew, no localization layer

- **Evidence:** `app.json:20-22` contains `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` in Hebrew literally.
- **Why it matters:** R-MVP-Core-4 says Hebrew-only is intentional, so this is fine in MVP. But a future English / Arabic version would have to manage permission strings via Expo's `infoPlist` localization. Document.

### 21.2 [MEDIUM] [needs-verify] Android `READ_EXTERNAL_STORAGE` may be over-broad on API 33+

- **Evidence:** Per Round 2 cross-cutting agent — `app.json` includes legacy storage permission. `expo-image-picker` handles scoped storage automatically on modern Android.
- **Fix:** Drop the manifest permission; let Expo's plugin govern it.

### 21.3 [MEDIUM] [verified] Web build uses Metro bundler, no CSP, no CORS doc

- See Round 1 §9.1 — same concern. Round 2 adds: Expo's web target with Metro is workable but unusual; document in DEVELOPER.md what static-export semantics are.

### 21.4 [MEDIUM] [probable] No `npm audit` / dependency scan in CI

- **Evidence:** `.github/workflows/ci.yml` — no audit step.
- **Fix:** Add `pnpm audit --audit-level moderate` as a separate non-blocking job, or wire Dependabot.

### 21.5 [LOW] [verified] `packageManager` not pinned in root `package.json`

- **Fix:** `"packageManager": "pnpm@<exact-version>"` so contributors get the right pnpm.

### 21.6 [LOW] [verified] Documentation drift

- `CLAUDE.md` references `SETUP_GIT_AGENT.md` — verify exists.
- `TECH_DEBT.md` lists TD-15 as "no IChatRepository Supabase adapter" — but `SupabaseChatRepository.ts` is shipped. **TD-15 should be moved to Resolved** with the resolution date.

---

## 22. Round 2 false positives — items not carried forward

| Round 2 agent claim | Why rejected |
| -------------------- | ------------ |
| "Guest preview shows 6 posts (R-MVP-Core-2 violated)" | `(guest)/feed.tsx:25` fetches `limit: 6` but `selectGuestPreviewPosts` (in `@kc/application`) slices the result to 3. Verified — the rule IS met. The earlier Round 1 finding on this is also withdrawn (it was already captured as ambiguous). |
| "Migrations 0010 / 0011 missing" | They exist (`0010_seed_super_admin.sql`, `0011_chat_helpers.sql`). The first listing accidentally truncated before showing them. |
| "Chat is fully mock-backed (TD-15)" | Stale. The Supabase adapter, repository, realtime client, and seven use cases are shipped under `app/packages/{infrastructure-supabase,application}/src/chat/`. TD-15 should be retired. The findings in §18 / §19 are about the **shipped** chat. |
| "URL fallback hint should add 'or type the URL manually'" | Round 1 already noted this as MEDIUM (FR-DONATE-003 AC4). Not a new finding. |
| "Counter denormalization triggers don't exist (R-MVP-Profile-5/6)" | Triggers do exist in `0006_init_stats_counters.sql` — what's missing is the `removed_admin` decrement branch (Round 1 §1.4) and the auto-recompute job. The agent's framing was too strong. |
| "Tab bar `flexDirection: 'row-reverse'` may visually break" | The implementation passes a smoke test on a forced-RTL device; the agent's concern is hypothetical without a screenshot. Not actionable. |
| "PostImageCarousel `position: 'absolute'` left/right" | Genuine RTL concern (carried in §16.2) but the screen agent overstated severity — the fix is one-line. Re-classed to HIGH (still high impact for users on RTL). |
| "Search query escape pattern bypasses with backslash" | The agent proposed an attack scenario via `\` in `ILIKE`. Postgres's parameterized query handling makes this academic in practice; the supabase-js client uses parameter binding, not string interpolation. Not a real vulnerability. |
| "Realtime subscription can be hijacked via channel name" | Round 2 cross-cutting agent's framing — but the channel filter is `chat_id=eq.<id>` and RLS gates the broadcast. Subscribing to a chat one doesn't belong to receives nothing. Not a hijack. |

---

## 23. Updated triage table (combined Round 1 + Round 2)

The hot list (rows 1-12 from §10) is unchanged. The combined picture adds these new high-priority rows:

| Order | ID (proposed) | Severity | Owner lane | Estimated effort | Lands with |
| ----- | ------------- | -------- | ---------- | ---------------- | ---------- |
| 13 | New TD (FE) | CRITICAL | FE | 0.5 day | §16.1 / §14.1 — add `FollowersOnly` row to `VisibilityChooser`, gate-disabled when public profile |
| 14 | New TD (BE) | CRITICAL | BE | 0.5 day | §15.3 — convert `rpc_get_or_create_support_thread` to `INSERT ... ON CONFLICT` upsert; same for `find_or_create_support_chat` in 0005 (§15.12) |
| 15 | New TD (BE) | CRITICAL | BE | 0.5 day | §15.2 — `revoke execute on function active_posts_count_for_viewer, has_blocked from public, anon` |
| 16 | New TD (BE) | HIGH | BE | 1 day | §17.1 — `RestoreSession` fetches `users.account_status`, sign-out on non-active |
| 17 | New TD (BE) | HIGH | BE | 0.5 day | §17.2 — collapse `mapAuthError` invalid-credentials & email-exists to single code |
| 18 | New TD (BE) | HIGH | BE | 1 day | §15.4 — `users_after_privacy_change` trigger to auto-approve pending follow_requests |
| 19 | New TD (BE) | HIGH | BE | 1 day | §18.1 — add `messages.client_request_id` + adapter upsert |
| 20 | New TD (BE) | HIGH | BE | 0.5 day | §18.2 — make `findOrCreateChat` an `INSERT ... ON CONFLICT` |
| 21 | New TD (BE) | HIGH | BE | 0.5 day | §15.5 — drop `posts.reopen_count` from client UPDATE grant |
| 22 | New TD (BE) | HIGH | BE | 0.5 day | §15.1 — drop `reports.resolved_at, resolved_by` from client UPDATE grant |
| 23 | New TD (BE) | HIGH | BE | 2 days | §19.1 — minimal rate-limit table + helper used by `messages`, `reports`, `follow_edges`, `media_assets` triggers |
| 24 | New TD (BE/FE) | HIGH | both | 2 days | §17.3 — onboarding state-machine guards in use cases + DB trigger |
| 25 | TD-24 (existing) | HIGH | FE | 5 days | §14.7 — Apple SSO is a launch blocker for App Store iOS submission, not a P3 deferral |
| 26 | TD-15 (existing) | — | — | 0 day | Move to Resolved with the date the chat infra shipped — clean up `TECH_DEBT.md` to reflect reality |
| 27 | New TD (BE) | MEDIUM | BE | 1 day | §15.6 — INSERT-policy `account_status = 'active'` guard on posts/chats/messages |
| 28 | New TD (BE) | MEDIUM | BE | 1 day | §15.10 — auto-clear `account_status_until` on expiry |
| 29 | New TD (FE) | MEDIUM | FE | 0.5 day | §16.4 — accessibility-label sweep for icon-only buttons |
| 30 | New TD (FE) | MEDIUM | FE | 0.5 day | §16.5 — preserve form values on publish error |
| 31 | New TD (BE) | MEDIUM | BE | 0.5 day | §15.11 — gate `inject_system_message` to admin-only or revoke RPC grant |

---

## 24. Closing notes

- The single most consequential **safety** finding from Round 2 is §17.1 (suspended users continue to function). Combined with §15.6 (suspended users can still post / chat), the entire moderation suspension model from R-MVP-Privacy-5 is currently a no-op once the user is signed in. This should be hot-fixed before the chat realtime work merges to main.
- The single most consequential **product** finding is §16.1 (`FollowersOnly` UI completely missing). The infra layer supports the third visibility level, the RLS predicates respect it, the trigger validates upgrades — and the form excludes the option. Users with Private profiles (R-MVP-Profile-9) cannot publish FollowersOnly posts. Half-built features that *look* finished are how PRD-vs-impl drift compounds; this should ship before the next release.
- The chat infrastructure is **substantially more shipped than `PROJECT_STATUS.md` reflects.** Either an audit pass through `PROJECT_STATUS.md` § "What is fake / stubbed" + `TECH_DEBT.md` (TD-15) updates the public picture, or someone needs to make sure the chat work isn't being measured against a "P0.5 planned" baseline when it's already P0.5 in-flight.

*End of audit (Round 1 + Round 2). Triage owner: pick a BE and an FE lead, walk §10 + §23 row-by-row, and convert each into a `TD-*` entry with a closing slice. Items 1, 2, 3, 4 in the headline table are hotfix-grade and should not wait for a sprint boundary.*
