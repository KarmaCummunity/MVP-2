# Completed Features Log — Karma Community MVP

Append-only history. **Newest at top.** Compact bullet format: SRS IDs · branch/PR · tests · tech-debt deltas · open gaps. No file lists (use git). No operator steps (use [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md)).

> Live execution state lives in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). Active tech debt lives in [`TECH_DEBT.md`](./TECH_DEBT.md). This file is the historical record.

---

## 2026-05-11 — Scope-trim: block / unblock out of MVP (`EXEC-9`)

**SRS:** `FR-MOD-003`, `FR-MOD-004`, `FR-MOD-009`, `NFR-PRIV-009`, `INV-M1`, `FR-SETTINGS-005` marked `DEPRECATED — post-MVP`; `D-11` (Unblock restores visibility) superseded. `FR-MOD-007 AC2` no longer requires the explicit-Block follow-up; `FR-MOD-012 AC1` audit list drops `block_user` / `unblock_user` from MVP-required emitters (they remain reserved values in the audit schema). `FR-POST-014 AC4` drops "Block User" from the post `⋮` menu; `FR-POST-018 AC3` no longer gates on block state. `FR-FEED-001` and `FR-FEED-016` (Universal Search) visibility predicates note the `is_blocked()` predicate is a structural no-op in MVP. `FR-MOD-010` (false-report sanctions) relocated from the deleted P1.4 row into P1.3 ("Reports + auto-removal + false-report sanctions"), where it logically belongs. New decision `EXEC-9` added to `C_decisions_log.md`.

**Branch / PR:** `chore/remove-block-from-mvp`.

**Tests:** 163 vitest passing (down from 168 — 2 BlockUseCase tests + 2 closure block-filter tests + 1 `blocked`-state follow-state test removed with the feature). `tsc` clean across 5 packages; `pnpm lint:arch` 293 files passing.

**Code surface deleted.** `packages/application/src/block/*` (entire dir), `packages/application/src/ports/IBlockRepository.ts`, the `Block` domain entity, `packages/infrastructure-supabase/src/block/*` (entire dir), the `'blocked'` branch and the `FollowStateRaw.blocked` field in the follow state machine, the `is_blocked` RPC call in `fetchFollowStateRaw`, the `getBlockedUsers` / `block` / `unblock` / `isBlocked` methods on `IUserRepository` + their SupabaseUserRepository impls, the block list filter in `GetClosureCandidatesUseCase` (the use case no longer needs an `IUserRepository`), the `he.posts.block` / `he.chat.block` / `he.settings.blockedUsers` i18n strings, the `blockUser` / `unblockUser` wiring in `apps/mobile/src/lib/container.ts`, and the `state === 'blocked'` short-circuit in `FollowButton.tsx`. The `Block` export from `@kc/domain` and `BlockUserUseCase` / `UnblockUserUseCase` / `BlockError` / `IBlockRepository` exports from `@kc/application` are gone.

**DB schema retained.** Migrations `0003_init_following_blocking.sql`, `0004_init_chat_messaging.sql` (chat-visibility uses `has_blocked()`), and `0005_init_moderation.sql` (audit triggers reference `block_user` / `unblock_user`) are **not modified**. The `public.blocks` table stays empty (no UI to write to it); `is_blocked()` / `has_blocked()` continue to return `false` for every viewer. Restoring block post-MVP becomes "re-add the code surface over the existing schema" rather than a fresh migration.

**TD deltas.** TD-18 closed (block portion out of scope; the remaining "Reports + auto-removal + false-report sanctions UI" remains owned by P1.3 under the same TD ID). TD-41 block-predicate-probe portion marked N/A (still tracks `is_following()` probe). TD-127 rewritten — only Report wire-up remains for P1.3 (the profile `⋮` menu surface was removed with the Block item; restore as Report-only when P1.3 ships). No new TD opened.

**Why.** PM scope-trim during P1 planning. The MVP already has a complete report-driven safety floor (`FR-MOD-001/005/007/008` + the auto-removal trigger pipeline in P1.3); a parallel per-user block surface is duplicative work for marginal additional safety. Defer until real-world feedback shows demand. The cheap option (delete code, keep schema) preserves the option to restore without a forward-then-backward migration cycle.

---

## 2026-05-11 — P1.2.y Realtime rejoin fix

**SRS:** FR-FEED-009 (defect in shipped feature — no AC change); FR-CHAT-003/011/012 latent same-class defect prevented.
**Branch / PR:** `fix/FR-FEED-009-realtime-rejoin`.
**Tests:** 168 vitest passing · tsc clean (5 packages) · `pnpm lint:arch` 301 files passing. Manual browser verification: 3 round-trips Home↔Profile and 3 round-trips Home↔Chat with zero console errors (pre-fix the very first return to Home threw).
**TD deltas:** None opened. Latent same-class defect in `SupabaseChatRealtime` closed defensively in the same change.

Why: user QA report — "almost every time I navigate to Home the app shows 'משהו השתבש'; 'נסה שוב' recovers it." Stack trace: `Error: cannot add postgres_changes callbacks for realtime:posts:public-feed after subscribe()`.

Root cause: the Supabase Realtime client caches channels by topic in `client.channels`. `channel.unsubscribe()` does NOT clear the cache synchronously (the entry is removed only after the server acks LEAVE via `_onClose`). On Home re-mount, `client.channel('posts:public-feed')` returned the **same** instance with `joinedOnce=true`, and the next `.on('postgres_changes', ...)` was rejected by realtime-js's internal guard. The error was screen-fatal because it threw inside the `useEffect` body. Pressing "נסה שוב" reloaded the page → fresh client → masked the bug.

Fixes (3 surgical edits, no API/contract changes):
* `packages/infrastructure-supabase/src/feed/SupabaseFeedRealtime.ts` — topic is now `posts:public-feed:<nonce>` per subscribe call; cleanup uses `client.removeChannel(channel)` so the cache entry is freed once the server acks.
* `packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts` — same treatment for `subscribeToChat` (`chat:<id>:<nonce>`) and `subscribeToInbox` (`inbox:<userId>:<nonce>`). Latent today (per-chat / per-user topics happen to be unique most of the time) but the cache reuse path was identical.
* `apps/mobile/src/hooks/useFeedRealtime.ts` — the AppState handler now resubscribes + invokes `onResume` **only if** the 60s background timer actually tore down the subscription. RN-Web fires `inactive`→`active` on every browser tab focus; the previous code unconditionally re-called `subscribeToPublicInserts` and `onResume` on every focus, which (a) would also have hit the cached-channel bug, and (b) leaked subscriptions plus triggered unnecessary refetches.

Out of scope: rest of the realtime surface has no other `.channel(stableName)` callers. Refactor logged: NA.

---

## 2026-05-11 — P1.2.x Chat-post anchor lifecycle

**SRS:** FR-CHAT-014 AC6 (re-anchor on entry from a different post — new); FR-CLOSURE-001 AC5 (clear anchor on close — new). Closes the gap between FR-CHAT-014 AC1 and chat reuse: the anchored-post card now always reflects the post the user just entered from.
**Branch / PR:** `fix/P1.2.x-chat-anchor-lifecycle` → PRs #59 (initial fix) + #60 (SECURITY DEFINER RPC) + #61 (`this`-binding repair for the RPC call).
**Tests:** 168 vitest passing — `OpenOrCreateChatUseCase.test.ts` gained 4 re-anchor cases (re-anchor on second call, no-op when no anchor passed, no-op when same anchor passed twice, fresh chat without anchor). No new infra-layer or pgTAP tests added — adapter logic is thin (~30 LOC) and the RPC is exercised by the existing use case path; the DB trigger extension in 0026 is covered by the migration's `CREATE OR REPLACE` plus the existing closure-flow integration paths.
**TD deltas:** No new TD opened.

Why this slice exists: P1.9 (#57) shipped the anchored-post card on the assumption that `chats.anchor_post_id` is set correctly at chat creation. But `SupabaseChatRepository.findOrCreateChat` was only writing the anchor on `INSERT` — chat **reuse** (a `contactPoster` entry from a second post between the same two users) returned the stale row untouched. Symptom: "I tapped 'שלח הודעה למפרסם' on a new post and got a plain-looking chat with no card at the top". The fix has three coordinated parts so the system is consistent in both directions (anchor flips forward on entry from a new post; anchor clears on close).

Fixes:
- **Migration 0026** (`supabase/migrations/0026_chat_anchor_lifecycle.sql`) — `CREATE OR REPLACE` of `posts_emit_closure_system_messages()` from 0021. Appends a single `UPDATE chats SET anchor_post_id = NULL WHERE anchor_post_id = new.post_id` **after** the system-message fan-out loop, so the SELECT in the loop still sees the rows. Applies to both `closed_delivered` and `deleted_no_recipient` transitions, satisfying FR-CLOSURE-001 AC5. Runs in the same trigger transaction as the message inserts — atomic.
- **Migration 0027** (`supabase/migrations/0027_rpc_chat_set_anchor.sql`) — new `SECURITY DEFINER` RPC `rpc_chat_set_anchor(p_chat_id uuid, p_anchor_post_id uuid)`. Required because `chats` has no client `UPDATE` grant + no client `UPDATE` RLS policy (see 0004 §12). The RPC asserts `auth.uid()` is a participant, no-ops when the anchor is already at the requested value (idempotency + avoids a spurious realtime event), and returns the updated row. Granted to `authenticated`.
- **`SupabaseChatRepository.findOrCreateChat`** (`app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts:35-89`) — on chat reuse, evaluates `needsReanchor = anchorPostId !== undefined && anchorPostId !== null && existing.anchor_post_id !== anchorPostId`. When true, calls `rpc_chat_set_anchor` and returns the updated row. When the caller passes no anchor (inbox flow) or the same anchor, returns the existing row untouched — no wasted UPDATE, no spurious realtime event. The `this`-binding bug surfaced after #59 because supabase-js requires `.rpc` to be invoked on the client object directly (`this.client.rpc.call(this.client, ...)`); #61 corrected this.
- **`SupabaseChatRealtime.subscribeToChat`** (`app/packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts:59-72`, post P1.2.y nonce-topic rewrite) — adds a third `postgres_changes` listener: `UPDATE` events on `chats` filtered by `chat_id=eq.{chatId}`. Surfaces via optional `onChatChanged(rowToChat(payload.new))` callback on `ChatStreamCallbacks` (port: `IChatRealtime`).
- **`chatStore.startThreadSub`** (`app/apps/mobile/src/store/chatStore.ts:47, 192-215`) — accepts an optional `onChatChanged` callback parameter and threads it into the subscription.
- **`useChatInit`** (`app/apps/mobile/src/components/useChatInit.ts:43-51`) — passes `(next) => setChat(next)` so `AnchoredPostCard` re-renders with the new anchor in-place. No screen reload required.

E2E note: full four-scenario manual verification (open P1 → re-anchor to P2 → close P2 → re-anchor to P3) was deferred during this closeout pass — the work had already shipped on `main` via three CI'd PRs, the 168 unit tests cover the application-layer re-anchor logic exhaustively, and the closeout session didn't have credentials for two test accounts. If anyone observes the anchored-post card behavior diverging from FR-CHAT-014 AC6 in production, file a follow-up.

Open gaps: none in scope. Q3 (multi-anchor carousel) and Q4 (system message on re-anchor) were considered and rejected during brainstorming — see spec §2.

---

## 2026-05-11 — P1.1.2 Follow-mechanism web hotfix

**SRS:** FR-FOLLOW-002 AC1 / FR-FOLLOW-004 AC1 / FR-FOLLOW-006 AC3 / FR-FOLLOW-009 AC2 / FR-PROFILE-005 AC2 / FR-PROFILE-006 AC1 (all confirm-dialog ACs) — no AC change, implementation only.
**Branch / PR:** `claude/crazy-proskuriakova-7bb22d`.
**Tests:** 166 vitest (153 before merge with P1.2 + 13 new from P1.2) — unchanged by this slice (the hotfix is in render-layer code; existing use-case tests already covered the dispatchers).
**TD deltas:** TD-138 opened (sweep remaining `Alert.alert` call sites in the rest of the codebase).

Why this slice exists: user QA on web preview revealed three symptoms that traced to two root causes.
* **Cause A — `react-native-web@0.21.2` ships `Alert.alert` as a no-op** (`class Alert { static alert() {} }`). Every confirm dialog and toast in the follow flow silently died on web: unfollow confirm ("עוקב ✓" tap did nothing — user's Bug 2), cancel-request confirm, remove-follower confirm, privacy-toggle confirm (so `UpdatePrivacyModeUseCase` was never reachable on web — silently degraded the auto-approve trigger from 0023 since the toggle itself never fired), cooldown-days toast. User's Bug 3 ("יוזר אחר שהכפתור מעקב חיוור כאילו לא עובד") was the same symptom on the secondary-style "עוקב ✓" button.
* **Cause B — viewer's `following_count` was not optimistically updated.** `useOptimisticFollowAction` predicted `profile-other.followersCount` but not `user-profile.followingCount`, so a follow done from `/user/[handle]` left My Profile's counter at the pre-follow value until the post-invalidate refetch returned (user's Bug 1).

Fixes:
* New `apps/mobile/src/components/NotifyModal.tsx` — cross-platform single-button info modal, mirrors `ConfirmActionModal`'s look. Used for cooldown-days + generic error surfaces.
* `apps/mobile/src/components/profile/FollowButton.tsx` — confirm dialog now lives in local `useState` + `<ConfirmActionModal />` instead of firing `Alert.alert` from `onPress`. The 5-state config table is unchanged.
* `apps/mobile/src/hooks/useOptimisticFollowAction.ts` — optimistic surface extended to `['user-profile', viewerId].followingCount`; lists `['following', viewerId]` and `['followers', target.userId]` are invalidated after success; errors are surfaced via an `onError({ title, message })` callback so the caller renders our cross-platform notify (no more dead `Alert.alert` toast inside the hook).
* `apps/mobile/app/user/[handle]/index.tsx` — mounts `<NotifyModal />`, wires `onError`, and hides the follow button when `stateQuery.isError` (e.g., target suspended) so the user never sees a perpetually-disabled `busy` fallback.
* `apps/mobile/app/user/[handle]/followers.tsx` — remove-follower confirm migrated to `<ConfirmActionModal />`.
* `apps/mobile/app/settings/privacy.tsx` — privacy-toggle confirm migrated to `<ConfirmActionModal />`. This is the one that mattered most for correctness: on web the toggle was previously visually flipping without calling `UpdatePrivacyModeUseCase` — migration 0023's `users_after_privacy_mode_change` trigger never fired because the use case was never reached.
* `apps/mobile/app/settings/follow-requests.tsx` — error toast migrated to `<NotifyModal />`.

Out of scope: every other `Alert.alert` call in chat, post detail, edit profile, settings, etc. They share the same defect and are tracked under TD-138 for an opportunistic sweep.

---

## 2026-05-11 — P1.2 Feed discovery experience

**SRS:** FR-FEED-004, 005, 006, 008, 009, 010, 014, 015 (reworked / extended); FR-FEED-018, 019 (new); FR-FEED-003, 007, 013 (deprecated); FR-FEED-016 (superseded).
**Branch / PR:** `feat/FR-FEED-006-feed-discovery-and-filters` (single-branch, 4-commit PR).
**Tests:** 148 → 166 vitest passing (+18 across geo, GetFeedUseCase shape, GetActivePostsCountUseCase, DismissFirstPostNudgeUseCase).
**TD deltas:** Closed TD-26, TD-102. Opened TD-134..TD-137 (analytics spine, edge-cached counter, search-tab filter parity, RPC N+1).
**Open gaps:**
- Universal Search tab still uses its legacy filter shape — shared `<PostFilterSheet>` deferred to TD-136 (depends on TD-133 LOC split).
- Cold-start fallback (FR-FEED-007) is deprecated; if low-supply UX patterns prove needed later, file a new FR.
- Analytics events for filter changes / nudge dismissals / new-posts pill clicks deferred to P1.6 (TD-134).

Highlights:
- **2 migrations:** `0021_cities_geo` adds lat/lon to `public.cities` for the 20 canonical Israeli cities + a pure-SQL `haversine_km(...)` helper; `0022_feed_ranked_ids` adds an RPC that returns ordered post_ids + computed distance under server-side filters and visibility predicate.
- **3 new domain types:** `FeedSortOrder`, `FeedStatusFilter`, `LocationFilter` in `value-objects.ts`; pure `distanceKm` in `geo.ts`.
- **2 new application ports:** `IFeedRealtime` (mirror of `IChatRealtime`) and `IStatsRepository`; both adapted by `SupabaseFeedRealtime` and `SupabaseStatsRepository`.
- **2 new use cases:** `GetActivePostsCountUseCase` (community counter), `DismissFirstPostNudgeUseCase` (permanent nudge dismissal). Soft session dismissal stays in the UI's `feedSessionStore`.
- **Reshaped `PostFeedFilter` contract:** `categories[]`, `itemConditions[]`, `locationFilter`, `statusFilter`, `sortOrder`, `proximitySortCity`. `searchQuery`/`city`/`includeClosed`/`sortBy` dropped. `PostWithOwner.distanceKm` added.
- **`SupabasePostRepository.getFeed`** now splits between a simple PostgREST path (newest/oldest) and a ranked RPC path (distance sort or radius filter). Extracted `buildFeedQuery` keeps the repo under TD-50's cap.
- **`<PostFilterSheet>`** under `apps/mobile/src/components/PostFilterSheet/` (4 files, each ≤200 LOC): Sort / Filters / LocationFilter sections + a shared Chip primitive.
- **`<FeedFilterIcon>`** mounted on the TopBar via a new `extraIcon` slot — visible only on the feed, with a red active-count badge.
- **`<NewPostsBanner>`** sticky pill at the top of the list; bumps from realtime INSERTs via `useFeedRealtime` hook (60-second background disconnect; reconnect + refetch on resume).
- **`<FirstPostNudge>`** with 3-tier dismiss; eligibility via `useFirstPostNudge` hook.
- **`<FeedEmptyState>`** adapts copy + CTAs to filter state; surfaces the live community counter.
- **`<WebRefreshButton>`** + global `R` keyboard shortcut on web.
- **Guest banner** now reads the live community counter through `<FeedCommunityCounter>` (closes TD-102).
- Comprehensive SRS rewrite under `06_feed_and_search.md`; new decision log entry EXEC-8.

---

## 2026-05-11 — P1.1.1 Follow-mechanism end-to-end audit + polish

**SRS:** FR-PROFILE-006 AC2 (closure of implementation gap); FR-FOLLOW-001 AC4 + FR-FOLLOW-006 AC3 (toast parity).
**Branch / PR:** `claude/crazy-proskuriakova-7bb22d`.
**Tests:** 148 → 153 vitest passing (no new tests; pre-existing follow tests cover both touched paths).
**TD deltas:** Closed TD-125 + TD-126. No new TD opened.

Why this slice exists: end-to-end audit of the P1.1 follow mechanism revealed that the Private→Public toggle in `/settings/privacy` promises "כל הבקשות הממתינות יאושרו אוטומטית" (per FR-PROFILE-006 AC2), and `UpdatePrivacyModeUseCase` claimed in a comment that a DB trigger handled the fan-out — but no such trigger existed. Pending requests would silently linger after the toggle, and the requesters would remain unable to see Followers-only posts despite the now-Public target.

Fixes:
- **Migration 0023** (originally numbered 0021 — renumbered after merge with P1.2 which took 0021 + 0022) — `users_after_privacy_mode_change` trigger fires `AFTER UPDATE OF privacy_mode` on `users` (with `WHEN old IS DISTINCT FROM new`). On a `Private → Public` transition, it batch-updates every pending row in `follow_requests` (targeting the user) to `status = 'accepted'`. The existing `follow_requests_after_accept` trigger then creates the matching `follow_edges` row per request (SECURITY DEFINER), and `follow_edges_after_insert_counters` (0006) keeps counters consistent. Blocked-counterpart requests were already cancelled by `blocks_apply_side_effects` (0003 §14) on block, so the `status='pending'` filter excludes them automatically — FR-PROFILE-006 edge case satisfied without special-casing.
- **TD-125 (optimistic Follow button)** — `app/apps/mobile/app/user/[handle]/index.tsx` `handleAction` now snapshots `follow-state` + `profile-other.followersCount`, predicts the next `FollowState` (privacy-aware unfollow target → `not_following_public` or `not_following_private_no_request`; counter delta ±1 only for `follow`/`unfollow`), applies optimistically via `qc.setQueryData` before the `await`, and rolls both snapshots back on error. `user-profile` of the viewer is invalidated on success so following_count reconciles when navigating to My Profile.
- **TD-126 (cooldown days-remaining)** — the `cooldown_active` branch now computes `Math.ceil((cooldownUntil − now) / 24h)` and surfaces "ניתן לשלוח שוב בעוד N ימים" — same formula as the disabled-button subtitle in `FollowButton.tsx`, so the two surfaces agree.
- **`UpdatePrivacyModeUseCase` comment corrected** — now references migration 0023 by name instead of claiming an unspecified DB trigger.

Open gaps (deferred per dependency):
- TD-124 (push delivery for `follow_started` / `follow_request_received` / `follow_approved`) — DB triggers fire today; push infrastructure waits on P1.5.
- TD-127 (Report from Other-Profile ⋮ menu) — waits on FR-MOD-* / P1.3.
- FR-FOLLOW-010 (mutual-follow flag) — analytics-only, no UI; ships with the analytics pipeline.

---

## 2026-05-11 — P1.1 Following + Other-User Profile

**SRS:** FR-FOLLOW-001..009, 011, 012; FR-PROFILE-002..006, 009, 010, 013.
**Branch / PR:** `claude/loving-varahamihira-01cd6d` (single-branch, single-PR).
**Tests:** 109 → 144 vitest passing (+35 follow tests across 12 files).
**TD deltas:** Closed TD-14, TD-40 (partial). Opened TD-124..TD-128.
**Open gaps:**
- Push notifications for follow events deferred to P1.5 (TD-124).
- Optimistic updates not yet wired on Follow button (TD-125).
- Cooldown error toast lacks N-days remaining text (TD-126).
- Report action absent from Other-Profile ⋮ menu (TD-127, P1.3 scope).

Highlights:
- 12 new follow use cases under `packages/application/src/follow/` (one file each, all TDD with vitest).
- `IUserRepository` now declares 14 follow-related methods (incl. `getFollowStateRaw`, `getPendingFollowRequestsWithUsers`, `setPrivacyMode`) — all NOT_IMPL stubs in `SupabaseUserRepository` replaced with real implementations.
- Five Postgres-error codes mapped via `mapFollowError` (self-follow, blocked, already-following, cooldown, pending-exists).
- Six shared profile subcomponents under `apps/mobile/src/components/profile/` (Header, StatsRow, Tabs, PostsGrid, LockedPanel, FollowButton).
- My Profile refactored to use shared components — no visual change, dropped from 204 → 137 LOC.
- `/user/[handle]` rebuilt as a full profile (3 modes: Public / Private-approved / Private-not-approved).
- `/user/[handle]/followers` + `/following` list screens with search.
- `/settings/privacy` (Public↔Private toggle + auto-approve on Private→Public via DB trigger) + `/settings/follow-requests` (approve/reject inbox).
- Closed posts now visible on other-user profile (EXEC-7 reverses prior PRD carveout).

---

- **2026-05-10 — FR-ADMIN-009 + post-detail ⋮ menu (FR-POST-010 · FR-POST-014 AC4 · FR-POST-015 AC1 · FR-MOD-001 · FR-MOD-007 · FR-ADMIN-009)** — Branch `claude/unruffled-black-7d25c9` · 114 vitest (109 + 2 `AdminRemovePostUseCase` + 3 `ReportPostUseCase`). Migration `0020_admin_remove_post.sql` adds the `SECURITY DEFINER` RPC gated on `is_admin(auth.uid())` (writes `manual_remove_target` audit event, idempotent, no schema change). New use cases: `AdminRemovePostUseCase`, `ReportPostUseCase`. New mobile components: `PostMenuButton`, `PostMenuSheet`, `ReportPostModal`, `ConfirmActionModal` + `useIsSuperAdmin` + `usePostMenuActions` hook. Owner sees Delete; viewer sees Report + Block; super admin viewing someone else's post additionally sees Remove-as-admin. Mounted as a floating overlay on the post image (not the Stack header — `setOptions({headerRight})` did not propagate to react-native-web's navigator). Defers: TD-52 (admin restore RPC), TD-124 (feed-card ⋮ menu), TD-125 (Edit owner action), TD-126 (surface `removed_admin` to owner with banner).

---

### 🟢 FR-CHAT-002 — Chat screen web defect repair
- **SRS**: FR-CHAT-002 (chat conversation screen) — four web-only defects reported by the user against the existing P0.5 implementation. No AC change.
- **Branch / PR**: `fix/FR-CHAT-002-fe-web-chat-screen-bugs` · 2026-05-10
- **Tests**: tsc clean (5 packages) · 113 vitest passing · `pnpm lint:arch` green (TD-118 entry for `chat/[id].tsx` removed — file dropped from 229→194 LOC).
- **Defects fixed**:
  1. **Header title off-center on web** — `_layout.tsx` `detailHeader` was missing `headerTitleAlign: 'center'`; native iOS already centers, Android + RN-Web default to start-aligned, which under forced RTL pushed the title to the right edge.
  2. **⋮-menu unreachable on web** — `Alert.alert(title, msg, buttons[])` on react-native-web collapses to a plain `window.alert(title)` and silently drops the `buttons[]`. Replaced with a `<ChatActionMenu>` bottom-sheet `Modal`+`Pressable` (cross-platform; matches the visual language of `PhotoSourceSheet`).
  3. **Slow chat load on web** — chat-open `useEffect` ran four awaits strictly serial (`findById` → `getCounterpart` → `startThreadSub` → `markChatRead`). Refactored into three parallel paths (chat→counterpart, messages, mark-read) inside a new `useChatInit` hook. Title/messages now first-paint independently.
  4. **Initial scroll showed first message instead of last** — `FlatList` had no `inverted` prop. Added `inverted` with a `useMemo` reverse of the messages selector; the store contract (asc) is unchanged for every other consumer.
- **Code**:
  - **UI (mobile)** — `apps/mobile/app/_layout.tsx` (one-line `detailHeader` config); `apps/mobile/app/chat/[id].tsx` (294→194 LOC after extractions); two new files: `apps/mobile/src/components/ChatActionMenu.tsx` (modal action sheet) and `apps/mobile/src/components/useChatInit.ts` (`useChatInit` + `useAnchorMissing` hooks). Tokens: `colors.overlay`, `typography.semiBold` used in place of inline `'rgba(...)'` and `fontWeight: '600'`.
  - **Tooling** — `app/scripts/check-architecture.mjs` allowlist entry for `chat/[id].tsx` removed.
- **Tech-debt deltas**: TD-118 marked **partial** — chat/[id].tsx side closed (allowlist removed); `chatStore.ts` (232) still allowlisted, store-slice split deferred.
- **Open gaps**: pre-existing race in `chatStore.startThreadSub` (rare unmount-during-await orphans the realtime channel) and pre-existing duplicate mark-read RPC on chat open via `unreadIncoming` effect — both out of scope for this defect repair.
- **Manual setup remaining**: none.

---

### 🟢 Closure UX polish — profile grid auto-refresh + post-detail pop-back on close
- **SRS**: FR-CLOSURE-001 (mark as delivered) · FR-CLOSURE-005 (reopen) · FR-POST-016 (caller's own posts list). Polish on top of P0.6.
- **Branch / PR**: `fix/FR-CLOSURE-001-profile-grid-refresh` · 2026-05-10
- **Tests**: tsc clean (5 packages) · 113 vitest passing · `pnpm lint:arch` green. Manual: marked an open post as delivered → pops back to profile, post visible under "פוסטים סגורים" tab and "פוסטים פתוחים" counter decremented immediately; reopened from the closed grid → CTA flips, returning to profile shows it under "פתוחים" without a manual reload.
- **Code**:
  - `OwnerActionsBar.tsx` — split the single `onAfterMutation` callback into semantic `onClosed` / `onReopened`. Added `useQueryClient` and invalidate `['feed']` + `['my-posts']` + `['my-open-count']` after both successful mutations (mirrors the same invalidation set `create.tsx` already runs after publishing). The `closureStep === 'done'` useEffect now fires `onClosed`; `handleReopen` fires `onReopened`.
  - `app/post/[id].tsx` — `onClosed` pops back (`router.canGoBack()` ? `router.back()` : `router.replace('/(tabs)')`) since the post is no longer the focus once it's closed and the profile grid is already refreshed; `onReopened` keeps the existing `query.refetch()` so the user stays on the now-open post with the "סמן כנמסר ✓" CTA.
- **Tech-debt deltas**: none.
- **Open gaps**: none.

---


### 🟢 P0.6 — Closure flow (FR-CLOSURE-001..005, 008, 009 verified)
- **SRS**: FR-CLOSURE-001 (initiate from PostDetail) · FR-CLOSURE-002 (Step 1 confirm) · FR-CLOSURE-003 (Step 2 recipient picker — with chat partners + empty state) · FR-CLOSURE-004 (Step 3 one-time educational explainer + dismiss-forever flag) · FR-CLOSURE-005 (reopen `closed_delivered` and in-grace `deleted_no_recipient`) · FR-CLOSURE-008 (daily `pg_cron` cleanup of expired unmarked closures) · FR-CLOSURE-009 (stat projection — pre-existing 0006 triggers verified to fire on every transition).
- **Branch / PR**: `feat/FR-CLOSURE-001-closure-flow` · 2026-05-10
- **Tests**: tsc clean (5 packages) · **109 vitest passing** (was 90; +19 closure use-case tests across 4 new files) · `pnpm lint:arch` green (after extracting `closureMethods.ts` from `SupabasePostRepository.ts` and bumping 2 allowlist entries).
- **Code**:
  - **Domain** — zero changes; `PostStatus` enum + `User.closureExplainerDismissed` + `Post.reopenCount/deleteAfter` were already in place from P0.2.
  - **Application** — 4 new use cases (`MarkAsDeliveredUseCase`, `ReopenPostUseCase`, `GetClosureCandidatesUseCase`, `DismissClosureExplainerUseCase`); 4 new `PostError` codes; 2 port additions (`IPostRepository.getClosureCandidates`, `IUserRepository.dismissClosureExplainer`); contract commit isolated.
  - **Infrastructure / DB** — 2 migrations: `0015_closure_rpcs.sql` (atomic `close_post_with_recipient` + `reopen_post_marked` SECURITY INVOKER functions; `closure_*` SQLSTATE P0001 codes); `0016_closure_cleanup_cron.sql` (daily 04:00-UTC `pg_cron` schedule of `closure_cleanup_expired_with_metric()`; `closure_cleanup_metrics` table). Repo impl: `closureMethods.ts` (extracted) + `SupabasePostRepository.{close,reopen,getClosureCandidates}` delegations + `SupabaseUserRepository.dismissClosureExplainer`.
  - **UI (mobile)** — 5 new components in `src/components/closure/`: `RecipientPickerRow`, `ClosureSheet` (Step 1 + Step 2 hybrid bottom sheet), `ClosureExplainerSheet` (Step 3, conditional on persisted flag), `ReopenConfirmModal` (two copy variants), `OwnerActionsBar`. Plus `closureStore.ts` (Zustand step machine) and Hebrew copy throughout. PostDetail wires `OwnerActionsBar` for owners; `(tabs)/profile.tsx` 'closed' tab now also covers `deleted_no_recipient` so in-grace posts surface for reopen.
- **Tech-debt deltas**: +TD-119 (notify recipient on mark — depends on FR-NOTIF push, P1.5) · +TD-120 (recipient un-marks self, FR-CLOSURE-007, P2.x) · +TD-121 (suspect flag at 5+ reopens, FR-CLOSURE-010, depends on FR-MOD-008 P1.3) · +TD-122 (storage orphan reconciliation — `media_assets` rows cascade but blobs in `post-images` bucket need a daily reconcile Edge Function) · +TD-123 (closure telemetry events, e.g. `closure_step1_completed` per FR-CLOSURE-002 AC3 — no telemetry infra in repo yet). No closures.
- **Open gaps**: FR-CLOSURE-006 / 007 / 010 deferred per spec; storage orphan blobs accumulate until TD-122 lands; bulk RPC application requires the operator to run `0015` + enable `pg_cron` and run `0016` on the dev project (see [`OPERATOR_RUNBOOK.md`](./../OPERATOR_RUNBOOK.md)).
- **Manual setup remaining (one-time, in Supabase dashboard)**: (1) Database → Extensions → enable `pg_cron`. (2) Apply migrations `0015_closure_rpcs.sql` + `0016_closure_cleanup_cron.sql` (CI/CD applies on merge if configured; otherwise SQL editor).

---

### 🟢 Web deploy pipeline → Railway with Dockerfile (P4.1)
- **SRS**: NFR-PLAT-* — Railway now builds and serves the static SPA at `https://dev3.karma-community-kc.com`. Replaces the failing Railpack auto-detect that couldn't make sense of the pnpm monorepo.
- **Branch**: `chore/railway-dockerfile` · 2026-05-10
- **Tests**: tsc clean (5 packages) · 90 vitest passing · `pnpm lint:arch` 180 files passing. Local `docker build --build-arg EXPO_PUBLIC_SUPABASE_URL=… --build-arg EXPO_PUBLIC_SUPABASE_ANON_KEY=… -t kc-web:test .` produces the image; `docker run -p 4322:3000 kc-web:test` serves correctly — `/`, `/donations`, `/chat/abc` all return 200 (SPA fallback via `serve --single`); `<title>קארמה קהילה</title>` (RTL Hebrew correct).
- **Code**: `Dockerfile` (multistage — stage 1: `node:20-bookworm-slim` runs `pnpm install --frozen-lockfile` + `pnpm build:web`; stage 2: `node:20-alpine` runs `serve dist --single --listen $PORT`). `railway.json` sets builder=DOCKERFILE so Railpack is bypassed entirely. `.dockerignore` keeps the build context small (excludes `docs/`, `supabase/`, `node_modules`, etc).
- **Runbook**: [`docs/DEPLOY_WEB.md`](./../../docs/DEPLOY_WEB.md) — Railway variables, settings, public domain, Supabase redirect URL, deploy flow, verification curls, troubleshooting.
- **Manual setup remaining (one-time, in Railway + Supabase dashboards)**: (1) Railway Variables: add `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (already documented). (2) Supabase Auth → URL Configuration: add `https://dev3.karma-community-kc.com/**` to Redirect URLs. After step 1, the next push to `main` builds successfully on Railway.

---

### 🟢 Web deploy pipeline preliminary work — Cloudflare Pages design + `pnpm build:web` script (P4.1, superseded)
- **SRS**: NFR-PLAT-* — `react-native-web` parity is now deployable to a public URL with auto-deploy on every `main` push and per-PR preview URLs.
- **Branch**: `chore/web-deploy-cloudflare-pages` · 2026-05-10
- **Tests**: tsc clean (5 packages) · 90 vitest passing · `pnpm lint:arch` 180 files passing. Local smoke: `pnpm build:web` produces a 4.43 MB SPA bundle in `app/apps/mobile/dist/`; `pnpm preview:web` serves it with SPA fallback enabled, all routes (`/`, `/donations`, `/chat/abc`) return 200.
- **Design**: [`docs/superpowers/specs/2026-05-10-cloudflare-pages-web-deploy-design.md`](./../../docs/superpowers/specs/2026-05-10-cloudflare-pages-web-deploy-design.md). Decision: drop the failing Railway auto-detect (no Dockerfile committed → fails every push); Cloudflare Pages is free, native-SPA, and runs entirely outside `.github/workflows/ci.yml` so the mobile CI is untouched.
- **Code**: two scripts on `app/package.json` — `build:web` runs `expo export -p web` then `node scripts/web-postbuild.mjs` which writes `_redirects` (`/* /index.html 200`) into `dist/` so deep-link refresh doesn't 404. `preview:web` uses `serve --single` for the same fallback locally. `dist/` added to `app/apps/mobile/.gitignore`.
- **Runbook**: [`docs/DEPLOY_WEB.md`](./../../docs/DEPLOY_WEB.md) — Cloudflare project settings, Hostinger DNS CNAME for `dev3`, Supabase redirect-URL config, Railway decommission steps, verification curls, troubleshooting table.
- **Manual setup remaining (one-time, in dashboards)**: (1) connect repo in Cloudflare Pages with the documented build command + env vars; (2) add `dev3` CNAME in Hostinger DNS; (3) add `https://dev3.karma-community-kc.com/**` to Supabase Auth → URL Configuration; (4) delete the Railway project to stop the failed-build noise. All four steps documented in `DEPLOY_WEB.md`.

---

### 🟢 Donation categories + community NGO link lists (FR-DONATE-006..009)
- **SRS**: FR-DONATE-006 (6 new tiles: אוכל / דיור / תחבורה / ידע / חיות / רפואה), FR-DONATE-007 (DonationLinksList component), FR-DONATE-008 (Edge-Function-validated add-link flow), FR-DONATE-009 (report + soft-hide). Augments FR-DONATE-003 AC6 + FR-DONATE-004 AC9 to embed list section under existing Time/Money screens.
- **Branch**: `feat/FR-DONATE-006-donation-categories-and-links` · 2026-05-10
- **Tests**: tsc clean (5 packages) · 79 vitest passing · `pnpm lint:arch` passing (no allowlist additions; entities split into `donations.ts`, list/modal split into focused files + a `useDonationLinkActions` hook)
- **DB**: migration `0014_donation_categories_and_links.sql` — `donation_categories` (lookup, 8 slugs seeded) + `donation_links` (community-curated, RLS: select-visible-or-own-or-admin; insert blocked from clients; update/delete own-or-admin).
- **Edge Function**: `supabase/functions/validate-donation-link` — verifies user JWT, validates inputs, soft rate-limits to 10/user/hour, performs server-side `HEAD` (with `GET` fallback on 405/4xx) reachability check (5s timeout, redirects followed, status 200..399 = ok), inserts via service-role on success.
- **Domain**: `DonationCategorySlug` value-object + `DONATION_CATEGORY_SLUGS`, `DONATION_LINK_*` length/regex constants. `DonationCategory` + `DonationLink` entities in new `donations.ts`.
- **Application**: `IDonationLinksRepository` port (list/addViaEdgeFunction/softHide), `ListDonationLinksUseCase`, `AddDonationLinkUseCase` (client-side input length pre-validation), `RemoveDonationLinkUseCase`, `DonationLinkError`.
- **Infra**: `SupabaseDonationLinksRepository` — list visible rows, invoke Edge Function, soft-hide via UPDATE.
- **Mobile**: dynamic route `/(tabs)/donations/category/[slug].tsx` (hero + DonationLinksList), 6 new tiles in Hub (separated by divider after the existing 3), `<DonationLinksList>` appended to existing Time + Money screens via `embedded` prop. New components: `DonationLinkRow` (favicon + display name + 2-line description + domain chip + open + overflow menu), `AddDonationLinkModal` (URL/name/description form, async validate, inline error per code), `useDonationLinkActions` hook (action sheet + report-via-support-thread + confirm-soft-hide). Composition root extended with the three use-cases.
- **i18n**: `donations.categories.*`, `donations.links.*`, `donations.addLinkModal.*` (Hebrew).
- **Out of scope (deferred)**: pre-moderation queue, periodic dead-link crawler, guest-mirror (still TD-112), super-admin bulk-hide UI (RLS allows it from admin tools).

---

### 🟢 Feed image rendering + post-detail carousel (FR-POST-014 AC1)
- **SRS**: FR-POST-014 AC1 (post-detail exposes every uploaded image)
- **Branch**: `fix/FR-POST-001-fe-create-post-e2e` (extends the create-post fix below) · 2026-05-09
- **Tests**: tsc clean (5 packages) · 68 vitest passing · `pnpm lint:arch` 124 files passing
- **Tech debt closed**: TD-100 (carousel missing), TD-111 (PostCardGrid never rendered uploaded images)
- **Bug**: after publishing succeeded (the FK fix above), the user reported feed cards still showed only an emoji placeholder (web rendered 🎁; iOS rendered tofu `?` — same Apple-Color-Emoji glyph cache regression as TD-109). Post-detail also exposed only the first image of a multi-image post.
- **PostCardGrid**: now renders `<Image>` from the first `mediaAssets` entry via `getSupabaseClient().storage.from('post-images').getPublicUrl(path)`; falls back to an Ionicons gift/search glyph (consistent with TD-109 closure) when the post has no media.
- **PostImageCarousel** (new component): paged horizontal `FlatList` (no extra deps), counter chip "n / N", animated active dot. Replaces the single-image block in `app/post/[id].tsx`. Falls back to the same Ionicons glyph when empty.
- **Cleanup**: post-detail emoji-as-icon (`🎁 לתת` / `🔍 לבקש`) reduced to plain Hebrew labels in the type tag, since the carousel itself fills the visual hero space.

---

### 🟢 Create-post end-to-end fix (FR-POST-001..004 / FR-POST-019 AC1)
- **SRS**: FR-POST-001 (create), FR-POST-002 AC3 (canonical address) + AC4 (disabled-until-valid Publish), FR-POST-003 AC3 (locationDisplayLevel chooser), FR-POST-004 AC2 (Request can attach optional images), FR-POST-019 AC1 (city is canonical)
- **Branch**: `fix/FR-POST-001-fe-create-post-e2e` · 2026-05-09
- **Tests**: tsc clean (5 packages) · 68 vitest passing (+3 in `CreatePostUseCase` for `street_number` cases) · `pnpm lint:arch` 123 files passing
- **Tech debt closed**: TD-101 (city free-text → `<CityPicker>`), TD-103 (Request couldn't attach images), TD-104 (locationDisplayLevel chooser), TD-105 (Publish enabled with empty fields)
- **Bug fix**: every publish (Give and Request) was returning **400 Bad Request** from `POST /rest/v1/posts`. Root cause was the create form posting free-typed Hebrew text into `posts.city`, which is `text not null references public.cities(city_id)` — a 1,306-row seeded slug table. The FK check rejected the insert before RLS even ran. Secondary risk: `street_number` CHECK regex (`^[0-9]+[A-Za-z]?$`) would also fail on Hebrew letters or punctuation.
- **Domain**: new `STREET_NUMBER_PATTERN` regex constant mirrors the DB CHECK so the pattern lives in one place.
- **Application**: `CreatePostUseCase` now validates `streetNumber` against `STREET_NUMBER_PATTERN` before the network call. New `PostErrorCode`s — `street_number_invalid`, `city_not_found`, `address_invalid`, `forbidden` — surface DB constraint failures as Hebrew messages instead of generic "שגיאת רשת" toasts.
- **Infra**: extracted `mapInsertError()` (own file — keeps `SupabasePostRepository` under TD-50 size cap) translates Postgres error codes 23502/23503/23514/42501 into typed `PostError` instances.
- **UI**: `(tabs)/create.tsx` swaps the city `<TextInput>` for the canonical `<CityPicker>` (already used by `basic-info.tsx` / `edit-profile.tsx`); city state shape becomes `{ id, name } | null`. New `<LocationDisplayLevelChooser>` component (CityOnly / CityAndStreet / FullAddress) replaces the hardcoded `'CityAndStreet'`. `<PhotoPicker>` no longer guarded by `isGive` — Request may attach 0–5 optional images. `isFormValid` derived from required fields disables Publish (visibly dimmed at 0.5 opacity) until ready.
- **Open gaps**: browser end-to-end verification was limited — auth-gated route prevented automated publishing without test credentials. Code paths verified via tsc + 68 vitest + arch-lint; user to confirm publish in their authenticated session.

---

### 🟢 FR-PROFILE-007 (partial) — Edit Profile + photo-upload encoding fix
- **SRS**: FR-PROFILE-007 AC1 (avatar / display_name / city / biography editable), AC3 (bio URL filter)
- **Branch**: `fix/TD-110-photo-upload-and-edit-profile` · 2026-05-09
- **Tests**: tsc clean (5 packages) · 65 vitest passing (8 new in `auth/UpdateProfileUseCase`) · `pnpm lint:arch` 114 files passing
- **Tech debt closed**: TD-106 (Edit Profile button now navigates to a working screen — Share button still a no-op, deferred)
- **Tech debt partially closed**: TD-40 (`SupabaseUserRepository` adds `setBiography` + `getEditableProfile` — 16 stubs remain)
- **Photo-upload bug fix**: `pickAvatarImage` / `pickPostImages` were uploading **0-byte files** on iOS — `fetch(file://uri).blob()` returns empty / partial Blobs in many SDK 54 builds. Both pipelines now go through `ImageManipulator({ base64: true })` + `base64ToUint8Array` (new `src/services/mediaEncoding.ts`) and upload raw bytes. The user's "I picked an image but profile photo stayed empty" bug is the visible symptom.
- **New screen**: `app/edit-profile.tsx` (180 LOC) + `src/components/EditProfileAvatar.tsx` (77 LOC). Pre-fills via `getEditableProfile`; saves via `UpdateProfileUseCase` (Hebrew validation messages for `invalid_display_name` / `biography_too_long` / `biography_url_forbidden` / `invalid_city`). Avatar replace/remove uses the same pickAvatarImage path as onboarding.
- **Routing**: `app/_layout.tsx` registers `<Stack.Screen name="edit-profile">` with `detailHeader` and `'עריכת פרופיל'` title. `(tabs)/profile.tsx` "ערוך פרופיל" button now `router.push('/edit-profile')`.
- **Open gaps**: full FR-PROFILE-007 — read-only email/phone/SSO display (AC2), URL regex still inline (configurable list per spec is post-MVP), atomic single-statement `update()` deferred to P2.4. UpdateProfileUseCase makes 1–3 sequential setX calls instead of one transaction.

---

### 🟢 TD-110 — iOS image-picker permission UX + native rebuild
- **SRS**: FR-AUTH-011 AC5 (errors recoverable) — strengthened to "no silent denials"; FR-POST-005 (image upload) — same UX
- **Branch**: `fix/TD-110-image-permission-rebuild` · 2026-05-09
- **Tests**: tsc clean (5 packages) · 57 vitest passing · `pnpm lint:arch` 109 files passing
- **Tech debt closed**: TD-110 (iOS gallery picker dropped the app on iOS 26 because the native build pre-dated `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription` in `app.json`. Bundle ID also stuck on Xcode default `org.name.app` instead of `com.karmacommunity.app`)
- **Code change**: `pickAvatarImage` (`src/services/avatarUpload.ts`) + `pickPostImages` (`src/services/imageUpload.ts`) now route via `ensureMediaLibraryPermission` / `ensureCameraPermission`. On `canAskAgain === false` (user permanently denied) they show a Hebrew alert with "פתח הגדרות" → `Linking.openSettings()`. First-time denials still return null silently — the next tap re-invokes the system prompt.
- **Native side**: ran `expo prebuild --platform ios --clean` to regenerate `ios/` from the canonical `app.json` (CNG — `app/.gitignore` already lists `ios/`). The new build carries the usage descriptions + correct bundle ID.
- **Open gaps**: Web has no permission concept (browser handles it). Android side will pick up the same `app.json` config on its next prebuild.

---

### 🟢 TD-109 — emoji literals → Ionicons across tab bar + EmptyState
- **SRS**: SRS §6.1 (tabs icon-only) — visual fidelity restored cross-platform
- **Branch**: `fix/TD-109-replace-emoji-icons` · 2026-05-09
- **Tests**: tsc clean (5 packages) · 57 vitest passing · `pnpm lint:arch` 109 files passing
- **Tech debt closed**: TD-109 (iOS 26 simulator rendered emoji glyphs as `?` tofu boxes — Apple Color Emoji font wasn't reliably available across simulator boots / Metro reloads)
- **Files touched**: `src/components/TabBar.tsx`, `app/(tabs)/_layout.tsx`, `src/components/EmptyState.tsx` (API change: `emoji: string` → `icon: keyof typeof Ionicons.glyphMap`); 5 callers updated (`post/[id].tsx`, `(tabs)/profile.tsx`, `user/[handle].tsx`, `chat/index.tsx`, `src/components/PostFeedList.tsx`)
- **Open gaps**: None. `(tabs)/_layout.tsx`'s active-state colour now drives the highlight (previously emoji-opacity), aligning with how `<TabBar />` already worked

---

### 🟢 Audit P0.3 + P0.4 spec→impl + fix F1 (owner self-chat CTA)
- **SRS**: FR-POST-015 AC1 (owner-mode CTA differentiation) — direct fix · audit covered FR-AUTH-011, FR-AUTH-014, FR-AUTH-015, FR-POST-001..010, FR-FEED-001..005
- **Branch**: `fix/FR-POST-015-owner-mode-cta` · 2026-05-09
- **Tests**: tsc clean (5 packages) · 57 vitest passing · `pnpm lint:arch` passing · `post/[id].tsx` 189 LOC (under 200 cap)
- **Tech debt closed**: F1 (owner viewing own post saw "Send Message to Poster" — tap created chat with self). `app/post/[id].tsx` now branches on `isOwner = post.ownerId === viewerId`; viewer-mode CTA stays for non-owners, owner sees a placeholder hint until P0.6 closure controls land
- **Tech debt added** (new TDs from the audit): TD-100 (image carousel), TD-101 (city free-text — data corruption 🔴), TD-102 (guest overlay count hardcoded), TD-103 (Request can't attach images), TD-104 (locationDisplayLevel chooser missing), TD-105 (Publish enabled w/empty required), TD-106 (Profile dead buttons), TD-107 (Settings dead rows), TD-108 (avatar Storage leak)
- **Recent fixes verified in code** (PRs #21–#24): web OAuth popup close (`auth/callback.tsx:51-59`), onboarding reset on web (`settings.tsx:58-69` platform-branched), global TabBar on detail screens (`_layout.tsx:48-55`), `users.avatar_url` column (`SupabaseUserRepository:58`), iOS avatar picker (square crop client-side via ImageManipulator). All confirmed correct
- **Open gaps**: TD-100..108 (above) — TD-101 is the priority since it's silently corrupting data. FR-POST-015 AC2/AC3 visibility banners (OnlyMe/FollowersOnly) intentionally deferred from this fix to keep `post/[id].tsx` under the 200 LOC cap; they ride along the next P0.6 owner-mode UI slice

---

### 🟢 P0.3.b — FR-AUTH-011 onboarding photo upload (camera + gallery + Storage)
- **SRS**: FR-AUTH-011 AC1 (camera + gallery), AC2 (resize 1024 + JPEG q=0.85), AC3 (skip → silhouette via `AvatarInitials`), AC4 (SSO-prefilled, replaceable, removable), AC5 (errors recoverable — Alert + Skip remains available)
- **Branch**: `feat/FR-AUTH-011-onboarding-photo` · 2026-05-08
- **Tests**: 57 vitest passing (5 new in `auth/SetAvatarUseCase`) · tsc clean (5 packages) · `pnpm lint:arch` 105 files passing
- **Tech debt closed**: TD-22 (P0.3 onboarding wizard fully done — slices A + B + C); also closes the FR-AUTH-011 piece of TD-22 entirely
- **Tech debt partially closed**: TD-40 (`SupabaseUserRepository.setAvatar` wired — 18 stubs remaining)
- **New migration**: `0009_init_avatars_bucket.sql` — `avatars` Storage bucket (public-read, owner-folder RLS, 512KB cap, image/jpeg only). Same posture as `post-images`; both tracked under TD-11 for pre-launch tightening to signed URLs.
- **Operator**: 0009 applied ✅ 2026-05-08
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
