# Audit 2026-05-16 — Supplementary findings

Run after the primary 164-finding audit (see `99_consolidated.md`) earlier the same day. Goal: a second, independent pass with explicit SonarQube-style lenses (type safety, dead code, complexity, duplication, async/error swallowing) plus targeted verification of the previous pass.

The previous audit was thorough — most of what a fresh scan turns up is already filed. This document captures only the items that survived a NEW-vs-existing check against `TECH_DEBT.md` + `99_consolidated.md`. It also records verified **false positives** so the next audit doesn't re-spend time on them.

## Severity scale

Same as the primary audit: 🔴 HIGH / 🟠 MED / 🟢 LOW.

## NEW findings (verified, not in TECH_DEBT.md / 99_consolidated.md)

| # | Sev | Area | File:Line | Symptom | Why it matters | Proposed home |
| -- | -- | ---- | --------- | ------- | -------------- | ------------- |
| S1 | 🟠 | BE / actor-identity projection | `app/packages/infrastructure-supabase/src/posts/savedPostsMethods.ts:53-88` | `listSavedPostsPage()` reads `POST_SELECT_BARE` via the `saved_posts` join and **never** calls `applyPostActorIdentityProjectionBatch`. Saved-posts list leaks Hidden identities the same way `getProfileClosedPostsHelper` (TD-72) does. | A user marks B's post as saved; later B sets `exposure='Hidden'` on the post → the saved list still shows B's name + avatar. Same D-26 violation class as TD-72; saved list was missed in that cluster. | TD-**50** (BE) — fold into the P2.15 projection sweep |
| S2 | 🟠 | FE / persistence robustness | `app/apps/mobile/src/lib/notifications/usePushPermissionGate.ts:18-21` | `load()` does `JSON.parse(raw) as State` with no `try/catch`. Compare `savedPostsCursor.ts:11-18` which wraps the same call. Corrupted / out-of-shape AsyncStorage value (older app version, OS-level tampering, partial write) crashes the gate. | Pre-prompt gate becomes a crash bomb after schema evolution. Users who hit this lose the contextual-permission flow with no recovery short of reinstall. | TD-**158** (FE) |
| S3 | 🟠 | FE / error swallowing | `app/apps/mobile/app/settings/notifications.tsx:32-37` | `Notifications.getPermissionsAsync().then(...).catch(() => {})` — empty catch on the permission read. If the call rejects (rare but happens on cold-start before Expo module is hot), `permStatus` stays `'undetermined'` forever and the toggle UI never reflects OS state. | Settings → Notifications screen renders the wrong toggle state silently; user thinks they enabled notifications but didn't. No diagnostic. | TD-**159** (FE) |
| S4 | 🟢 | FE / observability | `app/apps/mobile/src/store/closureStore.ts:105,155` | Both `catch (e)` blocks normalize the error via `(e as Error).message` and drop the rest of the Supabase `PostgrestError` (`hint`, `code`, `details`). FK / CHECK constraint failures lose the actionable hint by the time they reach the user-facing toast. | Closure errors degrade to "violates foreign key constraint" with no column / hint. Slows triage and prevents helpful FE messages (e.g., "this post was already closed by someone else"). | TD-**160** (FE) — same pattern audit §2.2 flagged for posts adapter |
| S5 | 🟢 | FE / production logging | `app/apps/mobile/src/services/avatarUpload.ts:137` | `console.warn(\`avatar_remove: ${error.message}\`)` is unconditional — not behind `__DEV__`. Same file already gates other diagnostics behind `__DEV__`. Once TD-125 (Sentry) lands this becomes either noise or a missed breadcrumb. | Production console pollution on web; on native it surfaces in `expo-dev-client` only but is inconsistent with the rest of the codebase. | TD-**161** (FE) |
| S6 | 🟢 | FE / silent web push registration | `app/apps/mobile/app/_layout.tsx:16` (web SW register .catch swallows) | Service-worker register `catch` silently discards errors. When TD-65 (Web Push parity) lands, a 404 on `/sw.js` or scope mismatch produces no signal — push silently fails on web. | Latent foot-gun for TD-65; should at minimum `console.warn` in `__DEV__` and surface via Sentry once TD-125 lands. | TD-**162** (FE) — close together with TD-65 / TD-125 |
| S7 | 🟢 | BE / type safety | `app/packages/infrastructure-supabase/src/users/fetchUserBy.ts:32`, `searchUsers.ts:27`, `SupabaseUserRepository.ts:103`, `follow/followMethods.ts:76,96`, `follow/followRequestMethods.ts:116`, `posts/postRepoQueries.ts:17`, `posts/savedPostsMethods.ts:74`, `posts/getProfileClosedPostsHelper.ts:52`, `posts/feedQueryRanked.ts:101`, `posts/getMyPostsPage.ts:40` | 10 production-code `as unknown as <Row>` casts on Supabase query results. The generated `database.types.ts` (1324 LOC) deviates from PostgREST runtime shape (nested join rows, nullable counts), so casts are necessary today — but they hide rename safety. | When a column is renamed in a migration, the cast keeps compiling against the old shape. Bug surfaces only at runtime as `undefined` reads on the property. | TD-**51** (BE) — investigate `Database['public']['Tables']['x']['Row']` regeneration cadence + a narrow helper that asserts shape at runtime in `__DEV__` |
| S8 | 🟢 | FE / component API design | `app/apps/mobile/src/components/CreatePostForm/CreatePostFormScrollContent.tsx:18-51` | 21 `readonly` props on a single sub-component (`title`, `setTitle`, `description`, `setDescription`, `itemCondition`, `setItemCondition`, … 21 entries). Adding any new field cascades through ≥3 parent layers; `React.memo` is ineffective at this prop count. | Maintainability + perf smell. The `(tabs)/create.tsx` god-screen (TD-29) explodes downward via this prop bag. Either group props into a `formState` + `formActions` pair, or push the form state into a colocated Zustand store. | TD-**164** (FE) — folds into TD-29 split |
| S9 | 🟢 | Process | repo-wide grep for `TODO|FIXME|XXX|HACK` returns 0 hits across `app/packages` + `app/apps/mobile`. | Inline reminders are entirely absent; all open work flows through `TECH_DEBT.md`, `BACKLOG.md`, and spec files. **This is intentional and correct** per CLAUDE.md §5 ("Propose and Proceed"). Documenting here so future linters don't add a `no-inline-todo` ESLint rule that's already implicit. | Informational only — confirms the convention is being followed; the next audit's "find TODOs" pass can be skipped. | None — note in `DECISIONS.md` if the team wants it codified |

## Verified false positives (do not re-file)

Two of the four parallel exploration passes surfaced candidates that look severe at first glance but don't survive code-level verification. Recording them so the next audit can short-circuit:

| Claim | Where | Why it is **not** a real issue |
| ----- | ----- | ----------------------------- |
| Open redirect on `account-blocked.tsx` via `globalThis.window.location.assign(url)` | `app/apps/mobile/app/account-blocked.tsx:17` | The `url` is `mailto:` constructed from `SUPPORT_EMAIL` (constant) + `he.accountBlocked.supportMail.{subject,body}` (compile-time i18n strings). No user-controlled data flows into it; the `until` param is rendered as text via `toLocaleDateString`, never concatenated into a URL. |
| XSS via OAuth `error_description` reflection | `app/apps/mobile/app/auth/callback.tsx:34,80` | The reflected value is rendered through React Native `<Text>` (and `react-native-web`'s `<span>` equivalent). Both auto-escape `textContent`; no `dangerouslySetInnerHTML` is used. Provider-injected HTML would render as literal text. |
| `link_id` SQL-injection / no UUID validation in `validate-donation-link` | `supabase/functions/validate-donation-link/index.ts:227` | PostgREST parameterizes `.eq('id', linkId)` — the value is passed as a typed parameter, not concatenated. A non-UUID id returns "no row" via `.maybeSingle()`, which the handler maps to `invalid_input`. No injection path exists. |
| Rate-limit window uses "client-computed" clock in `validate-donation-link` | `supabase/functions/validate-donation-link/index.ts:299` | The function runs server-side on Deno (Supabase Edge). `Date.now()` is the server clock, not the client's. The flag was based on a misread of which side of the wire `Date.now()` executes on. |
| Unsafe non-null assertion `ctx!.clone().json()` in `SupabaseUserRepository.deleteAccountViaEdgeFunction` | `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts:178` | Control flow on lines 170-172 has already returned for the `ctx == null` path (network case → throws `'network'`). At line 178 `ctx` is provably defined, and the JSON parse is wrapped in its own `try/catch` that falls back to `body = null`. Assertion is justified. |

## Cross-cuts already in TECH_DEBT.md (re-confirmed, no new TD)

The supplementary pass also re-saw — and confirms still actionable — these previously-filed items, with concrete evidence:

- TD-100 / FR-AUTH-017 AC3 — sign-out and delete-account paths both miss `deactivateCurrentDevice` (`useSettingsAccountActions.ts:21-33, 69-81`).
- TD-101 — `expo-secure-store` listed in `package.json` and `app.json` but zero `import` references in `app/apps/mobile`.
- TD-102 — `tapHandler.ts:7-10` still feeds `data.route as never` into `router.push` with no allow-list.
- TD-103 — `filterStore.ts:85`, `searchStore.ts:97`, `lastAddressStore.ts:30-44` all `persist()` with non-namespaced keys (`'kc-filters'`, `'kc-search'`, `'kc-last-address'`).
- TD-119 / TD-127 — `tapHandler.ts:23-29` calls `getLastNotificationResponseAsync()` synchronously on mount; no `isAuthenticated && onboardingState==='completed'` guard. AuthGate redirect can clobber.
- TD-120 — `app/(tabs)/index.tsx:143-160` passes `hasMore=true` but omits `onEndReached`. `feedQuery` is `useQuery` not `useInfiniteQuery`.
- TD-126 — `useFeedRealtime.ts:57-58` has `// eslint-disable-next-line react-hooks/exhaustive-deps` and `onResume` missing from the dep array → stale closure after filter change.

If/when those land, this section can be deleted.

## Sign-off

Net additions to TECH_DEBT.md: **8 NEW rows** — 2 BE (`TD-50`, `TD-51`, filling lane gaps) and 6 FE spillover (`TD-158`..`TD-162`, `TD-164`; `TD-157` was skipped to keep `TD-157` BE-numbered but reassigned to TD-50/51 — see TECH_DEBT.md). All 🟠/🟢. No new BACKLOG entries — every new row is opportunistic / cluster-fold, not P-tier.

Audit method:
1. Read `TECH_DEBT.md` + `99_consolidated.md` to establish the existing baseline.
2. Spawned four parallel scans (code smells, security, races/async, error handling). All four returned candidate lists; ~60% overlapped existing TDs, ~25% were verified false positives, the remaining ~15% are filed above.
3. Verified each survivor by reading the cited file + line range. Findings that survived only as cast assertions or speculative were dropped.
