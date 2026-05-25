# Performance Wave 2 — DB + React Query Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Cut Postgres round-trips on hot paths and stop refetch storms. Closes TD-137, TD-135, parts of TD-92 + TD-72 + TD-98.

**Architecture:** Two attack vectors — (1) collapse multi-round-trip patterns into single RPCs (feed, inbox), prune `select('*')`, defensive `.limit()`, push counter-drift fix; (2) right-size React Query: longer `staleTime`, no `refetchOnWindowFocus` default, per-query overrides for live data, replace stats polling with Supabase Realtime.

**Spec mapping:** § Wave 2 of `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md`.

**Depends on:** Waves 0 + 1 merged.

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `supabase/migrations/<n>_rpc_feed_one_round_trip.sql` | Create | New RPC returning full PostWithOwner rows in one query |
| `supabase/migrations/<n>_rpc_inbox_with_last_message.sql` | Create | LATERAL JOIN chats × last_message × sender × counterparty |
| `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` | Modify | `getFeed` calls new RPC; drops secondary SELECT |
| `app/packages/infrastructure-supabase/src/chat/getMyChats.ts` | Modify | Use new RPC; drop 3-query reconciliation |
| `app/packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts` | Modify | Wire batch projection into profile-closed + search |
| `app/packages/infrastructure-supabase/src/profile/getProfileClosedPostsHelper.ts` | Modify | Use `applyPostActorIdentityProjectionBatch` |
| `app/packages/infrastructure-supabase/src/search/searchQueryHelpers.ts` | Modify | Same |
| `app/packages/infrastructure-supabase/src/search/searchExploreHelpers.ts` | Modify | Same |
| `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts` | Modify | Replace `select('*')` with explicit columns |
| `app/packages/infrastructure-supabase/src/donations/SupabaseDonationLinksRepository.ts` | Modify | Same |
| Various other files with `select('*')` | Modify | Same |
| `app/packages/infrastructure-supabase/src/about/SupabaseAboutRepository.ts` | Modify | Add `.limit(100)` |
| `app/apps/mobile/app/_layout.tsx:118-122` | Modify | New QueryClient defaults |
| `app/apps/mobile/src/hooks/useFeedRealtime.ts:43-47` | Modify | Range gap-fill on resume |
| `app/apps/mobile/src/hooks/useCommunityStatsAbout.ts` | Modify | Realtime subscription replaces polling |
| `app/apps/mobile/app/stats.tsx` | Modify | Drop polling + focus invalidation |
| `app/packages/infrastructure-supabase/src/__tests__/sqlProbes.integration.test.ts` | Modify | Add probes for new RPCs |

---

## Pre-flight

- [ ] Waves 0 + 1 merged.
- [ ] `git switch dev && git pull --ff-only && git switch -c feat/PERF-3-db-rq-fullstack`.

---

## Section A — `feed_one_round_trip` RPC

### A1: Author the migration

Find next migration number: `ls supabase/migrations/ | sort | tail -3`.

Read existing `feed_ranked_ids` to capture the exact visibility logic, distance sort, and filter params:

```bash
grep -rln "feed_ranked_ids" supabase/migrations/ | head -5
```

Open each result. The new RPC must replicate every visibility predicate (`is_post_visible_to`), every filter (categories, status, distance), every ORDER clause. Don't drift.

Write `<n>_rpc_feed_one_round_trip.sql`:

```sql
create or replace function public.feed_one_round_trip(
  p_viewer uuid,
  p_limit  int,
  p_before timestamptz,
  p_categories text[] default null,
  p_status_filter text default null,
  p_sort_by_distance boolean default false,
  p_viewer_lat double precision default null,
  p_viewer_lon double precision default null
)
returns table (
  post_id uuid, owner_id uuid, title text, body text, status text, visibility text,
  created_at timestamptz, category text, media_assets jsonb,
  owner_display_name text, owner_avatar_url text, owner_share_handle text,
  distance_km double precision
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id, p.owner_id, p.title, p.body, p.status::text, p.visibility::text,
    p.created_at, p.category::text, coalesce(p.media_assets, '[]'::jsonb),
    u.display_name, u.avatar_url, u.share_handle,
    case when p_sort_by_distance and p_viewer_lat is not null and p.lat is not null then
      earth_distance(ll_to_earth(p_viewer_lat, p_viewer_lon), ll_to_earth(p.lat, p.lon)) / 1000.0
    else null end
  from posts p
  join users u on u.id = p.owner_id
  where is_post_visible_to(p.id, p_viewer)
    and (p_before is null or p.created_at < p_before)
    and (p_categories is null or p.category::text = any(p_categories))
    and (p_status_filter is null or p.status::text = p_status_filter)
  order by
    case when p_sort_by_distance then 1 else 2 end,
    case when p_sort_by_distance then earth_distance(ll_to_earth(p_viewer_lat, p_viewer_lon), ll_to_earth(p.lat, p.lon)) else null end asc nulls last,
    p.created_at desc
  limit p_limit;
end;
$$;

revoke all on function public.feed_one_round_trip from public;
grant execute on function public.feed_one_round_trip to authenticated, anon;
```

Apply via Supabase MCP `apply_migration` to `roeefqpdbftlndzsvhfj`.

Smoke: `select count(*) from public.feed_one_round_trip(<active-user-id>, 20, now());` returns > 0.

Commit `feat(db): add feed_one_round_trip RPC for single-query feed (PERF-3, TD-137)`.

### A2: Integration probes

In `sqlProbes.integration.test.ts`, add tests covering:
- Anonymous viewer → only Public posts.
- Follower → sees Followers posts from people they follow.
- Owner → sees own OnlyMe posts.
- Banned post owner's posts excluded.
- Blocked user's posts excluded from blocker.
- Hidden-identity owner → `owner_display_name` / `owner_avatar_url` nulled per actor-identity projection.

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- sqlProbes`. PASS. Commit.

### A3: Adopt in repository

In `SupabasePostRepository.ts`, replace `feed_ranked_ids` + `.in()` with:

```typescript
const { data, error } = await this.client.rpc('feed_one_round_trip', {
  p_viewer: viewerId,
  p_limit: limit,
  p_before: cursor,
  p_categories: filters.categories ?? null,
  p_status_filter: filters.statusFilter ?? null,
  p_sort_by_distance: filters.sortOrder === 'distance',
  p_viewer_lat: viewerLat ?? null,
  p_viewer_lon: viewerLon ?? null,
});
if (error) throw error;
const posts: PostWithOwner[] = (data ?? []).map(mapFeedRowToPostWithOwner);
const nextCursor = posts.length === limit ? data[data.length - 1].created_at : null;
return { posts, nextCursor };
```

Add `mapFeedRowToPostWithOwner` next to existing mappers. Update unit tests to stub `rpc('feed_one_round_trip', ...)`. Commit.

---

## Section B — `rpc_inbox_with_last_message`

### B1: Author + probes

Migration `<n>_rpc_inbox_with_last_message.sql`:

```sql
create or replace function public.rpc_inbox_with_last_message(
  p_viewer uuid,
  p_limit  int default 50
)
returns table (
  chat_id uuid, counterparty_id uuid,
  counterparty_display_name text, counterparty_avatar_url text, counterparty_share_handle text,
  last_message_id uuid, last_message_body text, last_message_sender_id uuid,
  last_message_created_at timestamptz, last_message_kind text,
  unread_count int
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  with my_chats as (
    select c.* from chats c
    where (c.participant_a = p_viewer or c.participant_b = p_viewer)
      and is_chat_visible_to(c.id, p_viewer)
    order by c.last_message_at desc nulls last
    limit p_limit
  )
  select mc.id,
    (case when mc.participant_a = p_viewer then mc.participant_b else mc.participant_a end),
    cp.display_name, cp.avatar_url, cp.share_handle,
    lm.id, lm.body, lm.sender_id, lm.created_at, lm.kind::text,
    (select count(*)::int from messages m
       where m.chat_id = mc.id
         and m.sender_id is distinct from p_viewer
         -- adapt to actual schema for read-receipts:
         and (mc.last_read_at_a is null or m.created_at > mc.last_read_at_a))
  from my_chats mc
  join users cp on cp.id = (case when mc.participant_a = p_viewer then mc.participant_b else mc.participant_a end)
  left join lateral (
    select m.* from messages m where m.chat_id = mc.id order by m.created_at desc limit 1
  ) lm on true
  order by mc.last_message_at desc nulls last;
end;
$$;

revoke all on function public.rpc_inbox_with_last_message from public;
grant execute on function public.rpc_inbox_with_last_message to authenticated;
```

Replicate the unread-count logic from existing `rpc_chat_unread_total` (grep `unread` in migrations). Apply via MCP.

Add `sqlProbes` integration tests for: viewer with multiple chats, hidden chat, counterparty fields, last_message_*, unread_count vs manual count.

Commit `feat(db): single-query inbox RPC + integration probes (PERF-3)`.

### B2: Adopt in `getMyChats`

Replace 3-query body with one `rpc` call:

```typescript
const { data, error } = await this.client.rpc('rpc_inbox_with_last_message', { p_viewer: viewerId, p_limit: 50 });
if (error) throw error;
return (data ?? []).map(mapInboxRowToInboxItem);
```

Delete the reconciliation helpers that did manual chats → messages → users join. Update tests. Commit `feat(chat): getMyChats uses single-RPC inbox path (PERF-3)`.

---

## Section C — Column pruning + `.limit()`

### C1: Replace every `select('*')` in `infrastructure-supabase`

For each site (chat repo, donation links, search, post_actor_identity), read the consuming mapper, list only used columns. Examples:

```typescript
// chats:
.select('id, participant_a, participant_b, last_message_at, removed_at, inbox_hidden_at_a, inbox_hidden_at_b, created_at')

// donation_links:
.select('link_id, title, category_slug, link_url, owner_id, hidden_at, created_at')

// post_actor_identity:
.select('post_id, user_id, identity_visibility, hide_from_counterparty, surface_visibility, updated_at')
```

Typecheck; one commit `perf(db): prune select(*) to explicit columns (PERF-3)`.

### C2: `.limit()` sweep

Grep unbounded queries:

```bash
grep -rn "\.from(.*)\.select(" app/packages/infrastructure-supabase/src/ | grep -v "\.limit\|\.range\|\.single\|\.maybeSingle" | head -30
```

Inspect each. Anything returning multiple rows without natural cap gets `.limit(100)`. Special cases: `about_team_members` → `.limit(100)`; `getMyChats` → `.limit(50)`. Commit.

---

## Section D — Actor identity projection (TD-72)

Wire `applyPostActorIdentityProjectionBatch` into:
- `getProfileClosedPostsHelper.ts:42-62`
- `searchQueryHelpers.ts` (universal search post results)
- `searchExploreHelpers.ts` (universal search post results)

Pattern:

```typescript
import { applyPostActorIdentityProjectionBatch } from '../posts/applyPostActorIdentityProjection';

const postsWithOwner = await applyPostActorIdentityProjectionBatch({ client: this.client, viewerId, posts: rawPosts });
return postsWithOwner;
```

For search helpers, only project post-typed results; pass-through user/link results.

Tests: existing `applyPostActorIdentityProjection.test.ts` covers the batch path. Ensure profile-closed + search tests assert hidden-identity rows have nulled owner fields per D-26 truth table. Commit `feat(privacy): wire actor-identity projection into profile-closed + search (PERF-3, TD-72)`.

---

## Section E — QueryClient defaults

In `_layout.tsx:118-122`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60_000,       // 10 min default — most data is fine
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,  // explicit; Realtime + per-query overrides
      refetchOnMount: true,         // default; respects staleTime
      retry: 2,
    },
  },
});
```

Commit `perf(rq): widen default staleTime + disable refetchOnWindowFocus (PERF-3)`.

---

## Section F — Per-query staleTime audit

Grep `useQuery|useInfiniteQuery` across `app/apps/mobile/{src,app}/`. Promote each to a sensible override:

| Query | staleTime |
| --- | --- |
| Feed | 60_000 (1 min) — Realtime fills gaps |
| Inbox | 30_000 — Realtime fills |
| Profile (self) | 5 * 60_000 |
| Profile (others) | 60_000 |
| Stats (any) | 5 * 60_000 — Realtime, see Section G |
| Legal docs | Infinity (LegalDocumentCache already handles) |
| Cities, streets | 7 * 24 * 3600_000 — Wave 4 adds AsyncStorage |

One commit per area: `perf(rq): per-query staleTime overrides for <area> (PERF-3)`.

---

## Section G — Stats polling → Realtime

### G1: `useCommunityStatsAbout` Realtime

Replace `setInterval` with:

```typescript
useEffect(() => {
  let cancelled = false;
  async function fetchOnce() {
    const { data } = await getSupabaseClient()
      .from('community_stats')
      .select('active_posts_count, total_users, deliveries_count')
      .maybeSingle();
    if (!cancelled && data) setStats(data);
  }
  fetchOnce();
  const channel = getSupabaseClient()
    .channel('community-stats-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_stats' }, () => fetchOnce())
    .subscribe();
  return () => { cancelled = true; getSupabaseClient().removeChannel(channel); };
}, []);
```

Commit `perf(stats): replace 60s polling with Realtime subscription (PERF-3, TD-135)`.

### G2: `stats.tsx` cleanup

In `app/stats.tsx:45-62`:
- Drop `refetchInterval: 60_000`.
- Drop `useFocusEffect(() => qc.invalidateQueries(...))`.
- Set `staleTime: 5 * 60_000` on the useQuery.
- Add Realtime subscription mirroring G1 (or use the same hook).

Commit `perf(stats): drop polling + focus invalidation; rely on Realtime (PERF-3)`.

---

## Section H — Feed gap-fill on resume

In `useFeedRealtime.ts:40-48`:

```typescript
const lastSeenAtRef = React.useRef<string | null>(null);

// In INSERT handler: update lastSeenAtRef.current to new row's createdAt.

// On resume:
const onResume = async () => {
  if (!lastSeenAtRef.current) return; // initial fetch handles cold case
  // Implementation depends on whether feed uses useQuery or useInfiniteQuery.
  // For useInfiniteQuery, gap-fill writes to first page via queryClient.setQueryData.
  // Range query: feed_one_round_trip with p_before = now(), filter newer than lastSeen,
  // then prepend to existing data.
};
```

Mirror the existing inline-realtime-insert logic for the splice. Commit `perf(feed): gap-fill on resume instead of full refetch (PERF-3, closes TD-126#3)`.

---

## Section I — SSOT + PR

Close TD-137, TD-135. Narrow TD-98 (reactive + double-read sub-bullets closed; rest open). Narrow TD-72 (profile-closed + search wired; other surfaces left if any). Close remaining TD-126 sub-bullet.

Add PERF-3 to `BACKLOG.md` under P1:

```
| PERF-3 | Performance Wave 2 — single-RPC feed + inbox + column pruning + RQ config + stats Realtime + feed gap-fill | agent-fullstack | ✅ Done | `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 2; `docs/superpowers/plans/2026-05-25-perf-wave-2-db-rq.md` |
```

Commit `docs(ssot): close TD-137/TD-135; narrow TD-98/TD-72; close TD-126; add PERF-3`.

### Verification

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Smoke:
- DevTools Network on feed → ONE `rpc/feed_one_round_trip` call per page (not two).
- DevTools Network on inbox → ONE `rpc/rpc_inbox_with_last_message`.
- Switch tab back to feed → no immediate refetch (window focus disabled).
- Manually update a row in `community_stats` via Studio → stats screen reflects within ~1s without polling.

Sentry: `feed.first_render` p50 should drop further vs Wave 1. Postgres `pg_stat_statements` should show ~50% fewer rows for feed + inbox paths.

### Push + PR

```bash
git push -u origin feat/PERF-3-db-rq-fullstack
gh pr create --base dev --head feat/PERF-3-db-rq-fullstack \
  --title "perf: Wave 2 — single-RPC feed + inbox + RQ config + stats Realtime (PERF-3)" \
  --body "..." --label "PERF" --assignee "@me"
gh pr merge --auto --squash --delete-branch
```
