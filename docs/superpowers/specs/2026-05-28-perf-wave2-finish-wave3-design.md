# Performance — Wave 2 Finish + Wave 3 — Design

| Field | Value |
| --- | --- |
| **Date** | 2026-05-28 |
| **Status** | Draft — pending PM sign-off |
| **Driver** | PM directive — "improve platform performance" |
| **Parent design** | [`2026-05-25-app-performance-overhaul-design.md`](2026-05-25-app-performance-overhaul-design.md) — diagnosis + waves architecture |
| **Mapped to** | PERF-3 (Wave 2 deferred half) + PERF-4 (Wave 3, new). Closes TD-137, TD-92 (most), partial TD-72; advances TD-126. |

---

## TL;DR (for the PM)

Two follow-on shipments to the perf overhaul, sequential, both targeting `dev`:

1. **Shipment A — Feed + Inbox open faster.** Today the feed makes 3 server round-trips to render a page and the inbox makes 4. Both collapse to one. Users will feel: feed scrolls into view ~½ the current time, opening the chat list is snappier, and mobile data per session drops further on top of Wave 1's image wins.

2. **Shipment B — Push notifications stop spamming and stop costing.** Today every notification triggers its own server function and its own Expo API call. Bundling them cuts our hosting bill on notifications by an order of magnitude and lets a chat burst of 8 messages arrive as one "8 new messages" instead of 8 separate pings.

Both shipments are measurable via the Sentry dashboards Wave 0 already wired. Both have well-defined rollback paths.

**Calendar estimate:** Shipment A ~2-3 days work; Shipment B ~3-4 days work. Total ~1 week of focused engineering. Each ships as its own PR against `dev`.

---

## What changes for users

### After Shipment A ships

| Surface | Before | After |
| --- | --- | --- |
| Cold open → feed first row painted | ~1.5-3s perceived | Sentry-measured cut ≥40% on `feed.first_render` p50 |
| Tap inbox tab → chat list painted | 3-4 sequential queries, noticeable delay on heavy chat users | Single query, painted essentially instantly |
| Heavy chat users (50+ threads) | Inbox query transferred every unread message just to count them | Counter computed server-side; payload shrinks 10× for power users |

### After Shipment B ships

| Surface | Before | After |
| --- | --- | --- |
| Chat burst (8 messages in 2 minutes) | 8 separate push notifications | One push: "8 new messages" |
| Notification server cost | One Edge Function invocation per notification, one Expo API call per notification | ~50-100× fewer invocations at any volume |
| Expired push tokens (stale devices) | One DELETE per dead token | One DELETE per batch |

### What does NOT change

- No new product features. Existing notification kinds, copy, preferences, opt-out behavior, and visual UI are unchanged.
- Feed ordering, visibility (Public/Followers/OnlyMe), banned/blocked filtering, and hidden-identity rules — all identical to current behavior. Verified via an integration test matrix.
- Inbox ordering, deleted-counterpart collapsing, support thread rendering, system message previews — all preserved.

---

## Out of scope (explicitly deferred)

- FlashList migration for feed/inbox — left for later, decided when measurement shows it's needed.
- CDN setup (Wave 4 PR 4.1) — separate shipment.
- Cold-start parallelization (Wave 4 PR 4.2) — separate shipment.
- AsyncStorage cache for cities/streets (Wave 4 PR 4.3-4.4) — separate shipment.
- Redis or external KV — still not justified at current scale.

---

## Success metrics

All baselines come from the Sentry dashboards Wave 0 already collects.

### Shipment A
- `feed.first_render` p50 drops ≥40% versus the current pre-Shipment-A baseline (cumulative cut from the original Wave 0 baseline ≥50%).
- Inbox open transaction (Sentry `screen.transition` from tap to first chat row painted) p50 ≤ 250ms.
- Postgres reads per feed page: from 3 (RPC + posts SELECT + identity SELECT) to 1.
- Postgres reads per inbox open: from 4 (chats + messages + unread + users) to 1.

### Shipment B
- **Non-chat notification kinds (the batched path):** Edge invocations per 100 notifications drops to ~1 (≥99% reduction). One Expo API call per batch versus per-notification today.
- **Chat notifications (still immediate):** latency unchanged. Expo API calls per multi-token send drop because the per-token loop becomes a single batched call.
- **Mixed production traffic across a 1-hour controlled load test (1000 notifications, ~60% chat / 40% social mix):** total Edge Function invocations drop ≥50%, in line with the parent design's target.
- A user receiving 8 chat messages in a 5-minute window inside one chat gets one "8 new messages" push, not 8 separate pushes.

---

## Sequencing and rollout

**Shipment A first.** Lower risk (no infrastructure changes), faster to ship, and the user-felt feed+inbox wins are the most direct continuation of the Wave 1 momentum.

1. PR A from branch `perf/PERF-3-wave2-finish-feed-inbox-rpcs` → `dev`.
2. Merge, observe Sentry deltas in dev for 24 hours.
3. PR B from a fresh branch `perf/PERF-4-wave3-dispatcher-batching` cut from updated `dev`.
4. Merge.

Each PR follows the standard `CLAUDE.md` PR workflow (typecheck + test + lint green; PR body includes `Mapped to spec` line; SSOT updates in the same PR — `BACKLOG.md` flip, `TECH_DEBT.md` closures).

---

## Risks and mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| New feed RPC returns posts a user shouldn't see (RLS divergence) | High — privacy regression | Mirror RLS predicates inside RPC body via SECURITY DEFINER with explicit `WHERE` clauses. Integration test matrix covering every visibility class (Public, FollowersOnly, OnlyMe, banned author, blocked viewer, hidden-identity actor). |
| New inbox RPC over-discloses participant data | High — privacy regression | Same approach: SECURITY DEFINER + explicit predicate replication. Tests covering deleted counterpart, support thread, blocked-user threads. |
| Batched dispatcher delays a critical notification | Medium — UX regression | Chat messages (highest-frequency time-sensitive kind) stay on the existing immediate webhook path. Only social-category kinds batch. Documented in execution notes. |
| pg_cron job stops running silently | Medium — notification outage | Use the same pattern as the existing 5 cron jobs in this project (e.g., `0058_notifications_dispatcher_glue.sql`). Add a heartbeat row that the cron writes each run; alert if the heartbeat falls behind. |
| Token cleanup deletes a still-valid token (race) | Low — affected user re-registers next app open | Delete only tokens explicitly flagged `DeviceNotRegistered` by Expo. No change from current behavior — just batched. |
| Coalesce-window change creates duplicates during rollout | Low | Idempotent dedupe key; outbox `dispatched_at` guard prevents double-send. |

---

## TDs closed / advanced

- **Closes:** TD-137 (feed N+1).
- **Mostly closes:** TD-92 (push dispatcher cluster — coalesce key fix + batched dispatch land here; residual rare-event hardening tracked separately if surfaces).
- **Fully closes:** TD-72 (actor identity projection — final batched call subsumed into feed RPC).
- **Advances:** any remaining PERF-3 residue tracked under TD-126.

---

## Engineering execution appendix

> _PM: you don't need to read this. It's for the implementing agent._

### Shipment A — Wave 2 finish

**Migrations**
- `0133_rpc_feed_one_round_trip.sql` — SECURITY DEFINER function. Inputs: viewer_id + all filter params currently passed to `feed_ranked_ids` + page_limit + cursor fields. Output: one row per post with the same column set the current `POST_SELECT_OWNER` join produces, plus `distance_km` and the projected actor-identity columns (`actor_user_id`, `actor_display_name`, `actor_avatar_url`, `actor_is_hidden`, `viewer_follows_actor`). Implementation: CTE for the ranked/cursor logic (lifted from `feed_ranked_ids`), JOIN to `posts` (mirror RLS visibility: `is_active_member` + status + `is_blocked` + Public/Followers/OnlyMe predicate), LATERAL JOIN to `post_actor_identity` + `follow_edges` for projection. Returns the same shape regardless of ranked vs non-ranked filter — the FE single-callsite swap can drop both `feedQueryRanked.ts` and `feedQuery.ts`.
- `0134_rpc_inbox_with_last_message.sql` — SECURITY DEFINER function. Input: viewer_id, limit (default 50). Output: one row per chat with chat fields + `last_message_*` columns (id, body, kind, status, system_payload, sender_id, created_at) + `unread_count` integer + counterparty fields (user_id, display_name, avatar_url, share_handle, is_deleted). Implementation: chat selection mirroring `is_active_member` + inbox-visibility predicates + the `dedupeRowsByCounterpart` rule (highest `last_message_at` per counterpart) → LATERAL JOIN for last message → LATERAL `COUNT(*)` for unread → LEFT JOIN to `users_select_active` for counterparty. Single round-trip end-to-end.

**Frontend swaps**
- `app/packages/infrastructure-supabase/src/posts/feedQueryRanked.ts` + `feedQuery.ts` → replaced by a single `app/packages/infrastructure-supabase/src/posts/feedQueryOneRoundTrip.ts` that calls the new RPC. `SupabasePostRepository.getFeed` updated to use it.
- `app/packages/infrastructure-supabase/src/chat/getMyChats.ts` → single RPC call; `dedupeRowsByCounterpart` moves into the SQL (verified equivalence). Helpers `isVisibleInInboxForViewer` + `counterpartId` may stay if used elsewhere; otherwise removed.
- `applyPostActorIdentityProjectionBatch` no longer needed in the feed hot path; verify no other callers before deletion.

**Tests**
- `packages/infrastructure-supabase/src/posts/__tests__/feedOneRoundTrip.visibility.test.ts` — integration test against dev Supabase project covering: Public viewable to all, FollowersOnly viewable only to followers, OnlyMe invisible to others, banned author hidden, blocked viewer hidden, hidden-identity actor projected to anon.
- `packages/infrastructure-supabase/src/chat/__tests__/getMyChats.rpc.test.ts` — covers: deleted counterpart row, support thread routing, unread counter accuracy for read/unread/self-sent mix, inbox-hidden-side predicate.
- Existing tests for ordering, cursor semantics, and dedupe stay green via the same fixtures.

### Shipment B — Wave 3

**Migrations**
- `0135_dispatch_outbox_claim_batch.sql` — RPC `dispatch_outbox_claim_batch(p_limit int, p_exclude_kinds text[])` that runs `SELECT … FROM notifications_outbox WHERE dispatched_at IS NULL AND kind <> ALL(p_exclude_kinds) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT p_limit` and returns the locked rows. Caller commits after marking `dispatched_at`. Excludes `chat_message` (kept on immediate path).
- `0136_dispatch_outbox_cron.sql` — pg_cron job invoking the new Edge Function every 5 seconds via `net.http_post`. Mirrors the pattern in `0058_notifications_dispatcher_glue.sql`. Heartbeat row in `cron_heartbeats` table (new) updated on each run.
- `0137_notifications_outbox_coalesce_key.sql` — for chat: change dedupe key generator from per-minute to `chat:<chatId>:<viewerId>:<5min-bucket>` so coalesce works across reasonable bursts. For non-chat: no change.
- `0138_dispatcher_webhook_chat_only.sql` — narrow the existing notifications-outbox webhook trigger to fire only when `NEW.kind = 'chat_message'`. Non-chat rows are no longer pushed individually; they're claimed by the cron-driven batch processor instead.

**Edge Functions**
- `supabase/functions/dispatch-notifications-batch/index.ts` — new. Auth: service-role bearer (cron invocation). Body: ignored (cron pings). Flow:
  1. `supabase.rpc('dispatch_outbox_claim_batch', { p_limit: 100, p_exclude_kinds: ['chat_message'] })`.
  2. For each row, resolve recipient state + tokens (single batched `users` + `devices` query keyed by all `user_id`s in the batch — not per-row).
  3. Apply preference + suspended-account gates per row.
  4. Apply coalescing (existing `coalesce.ts` logic) per row.
  5. Build `ExpoMessage[]` array (one per row, possibly multiple tokens per `to`).
  6. Single `sendExpoPush(messages, EXPO_ACCESS_TOKEN)` call (Expo accepts up to 100).
  7. For tickets with `DeviceNotRegistered`: accumulate tokens, then one `supabase.from('devices').delete().in('push_token', failedTokens)` at the end.
  8. Mark dispatched in a single `UPDATE … FROM (VALUES …)` batched statement.
- `supabase/functions/dispatch-notification/index.ts` — narrowed. Webhook trigger updated to fire only when `kind = 'chat_message'` (DB-side filter — migration `0138_dispatcher_webhook_chat_only.sql`). Function body keeps current logic but no longer needs the kind branch; the coalesce key change from `0137` makes its existing chat coalesce branch effective across windows.

**Tests**
- `supabase/functions/dispatch-notifications-batch/__tests__/batch.flow.test.ts` — Deno test covering: claim → expo batch call → ticket loop → bad-token cleanup → mark-dispatched.
- pg_cron schedule asserted via `supabase/migrations/__tests__/0136_dispatch_outbox_cron.test.ts` (or whatever the project's migration-probe pattern is — match existing convention).
- Manual SQL probe: a 1000-row outbox burst processes in ≤ 60 seconds and registers ≤ 12 Edge invocations in Supabase logs.

---

## SSOT updates required in PRs

PR A:
- `docs/SSOT/BACKLOG.md` — add new row `PERF-4` (Wave 2 finish — feed/inbox RPCs); flip status during work.
- `docs/SSOT/TECH_DEBT.md` — close TD-137; advance TD-72 closure; narrow TD-126 if applicable.

PR B:
- `docs/SSOT/BACKLOG.md` — add new row `PERF-5` (Wave 3 — dispatcher batching); flip status during work.
- `docs/SSOT/TECH_DEBT.md` — close TD-92 (or narrow to any remaining residue).

Both PRs:
- Spec status header at top of this file flipped from `Draft` → `Shipped — PR #<num>` upon merge.
