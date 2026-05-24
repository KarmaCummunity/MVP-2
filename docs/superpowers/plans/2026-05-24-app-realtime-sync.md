# App Realtime Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Home Feed and Profile feel live (Instagram/Facebook-style) using a small number of Realtime channels, debounced cache updates, and scroll-aware feed merge — without full-feed refetches or per-screen subscriptions.

**Architecture:** One `RealtimeSyncCoordinator` in mobile (started from `AuthGate`, same lifecycle as chat inbox). Application ports `IPostRealtime` + `IUserRealtime`; Supabase adapters mirror `SupabaseChatRealtime` (unique channel topics, `removeChannel` on unsubscribe). TanStack Query remains source of truth: prepend/patch/invalidate — never a parallel entity store.

**Tech Stack:** Supabase Realtime (`postgres_changes`), TanStack Query v5, Expo Router focus, existing `GetPostByIdUseCase` / `GetFeedUseCase`.

**Design spec (approved):** [`docs/superpowers/specs/2026-05-24-app-realtime-sync-design.md`](../specs/2026-05-24-app-realtime-sync-design.md)

**Mapped to spec:** FR-FEED-009 (amend AC2/AC2b), FR-PROFILE-013 AC5, FR-STATS-001 AC2 (phase 3). **Refactor logged:** No (additive; retires `useFeedRealtime` wiring).

---

## Social-network principles → our MVP scope

| Big-app pattern | Our equivalent (phase 1) | Deliberately **not** building |
|-----------------|--------------------------|-------------------------------|
| Lightweight push signal | `postgres_changes` on filtered channels | Custom WebSocket server |
| Merge at top when scrolled up | `setQueryData` prepend after `getPostById` | Silent inject mid-scroll |
| Pill when scrolled down | Reuse `NewPostsBanner` + queued IDs | Full feed reload |
| Patch row on edit/close | `setQueryData` map/remove in cached feed page | Optimistic merge from raw payload |
| Central connection manager | `RealtimeSyncCoordinator` | Per-screen channels |
| Background throttle | 60s disconnect + one reconcile refetch | Always-on 24/7 subs |
| Memoized list cells | `React.memo(PostCard)` in same PR | Virtualized list rewrite |

**Stability rule:** If a Realtime handler cannot prove visibility (filters, blocks, proximity), it **drops** the event or does a **single** `getPostById` — never prepends from payload alone.

---

## File map

| Area | Files |
|------|--------|
| Design | `docs/superpowers/specs/2026-05-24-app-realtime-sync-design.md` |
| DB | `supabase/migrations/0107_posts_realtime_publication.sql` (next free number — verify) |
| Ports | `app/packages/application/src/ports/IPostRealtime.ts`, `IUserRealtime.ts` |
| Infra | `app/packages/infrastructure-supabase/src/feed/SupabasePostRealtime.ts` (new; supersedes `SupabaseFeedRealtime.ts`), `.../users/SupabaseUserRealtime.ts` |
| Infra tests | `.../feed/__tests__/SupabasePostRealtime.test.ts`, `.../users/__tests__/SupabaseUserRealtime.test.ts` |
| Mobile lib | `app/apps/mobile/src/lib/realtime/debounceAsync.ts`, `feedCacheSync.ts`, `profileCacheSync.ts` |
| Mobile lib tests | `app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts`, `debounceAsync.test.ts` |
| Coordinator | `app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts`, `useRealtimeSync.ts` |
| Composition | `app/apps/mobile/src/services/postsComposition.ts`, `userComposition.ts` |
| Wire | `app/apps/mobile/src/components/AuthGate.tsx` |
| Feed screen | `app/apps/mobile/app/(tabs)/index.tsx` |
| Deprecate | `app/apps/mobile/src/hooks/useFeedRealtime.ts` (remove after coordinator) |
| Session | `app/apps/mobile/src/store/feedSessionStore.ts` (queue IDs, not just count) |
| Profile | `app/apps/mobile/src/components/profile/MyProfileChrome.tsx` |
| Perf | `app/apps/mobile/src/components/PostCard.tsx`, `PostFeedList.tsx` |
| SSOT | `docs/SSOT/spec/06_feed_and_search.md`, `BACKLOG.md`, `DECISIONS.md`, `TECH_DEBT.md` |

---

## Phase 1 — Feed + My Profile (ship this first)

### Task 0: SSOT + decision (docs only)

**Files:**
- Modify: `docs/SSOT/spec/06_feed_and_search.md` (FR-FEED-009 AC2, AC2b)
- Modify: `docs/SSOT/DECISIONS.md` (new `D-34` or next free)
- Modify: `docs/SSOT/BACKLOG.md` (track in progress → done with PR)

- [ ] **Step 1:** Replace FR-FEED-009 AC2 with design §4.1 text; keep AC3 (60s background).
- [ ] **Step 2:** Add `D-*`: centralized `RealtimeSyncCoordinator` (channel cap, debounce, Query cache) — rationale: IG-style without per-screen subs.

---

### Task 1: Migration — `posts` in Realtime publication

**Files:**
- Create: `supabase/migrations/0107_posts_realtime_publication.sql`

- [ ] **Step 1: Write migration**

```sql
-- 0107_posts_realtime_publication | FR-FEED-009, FR-PROFILE-013
-- Idempotent add of public.posts to supabase_realtime (pattern 0007).

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = 'posts'
    ) then
      execute 'alter publication supabase_realtime add table public.posts';
    end if;
  end if;
end $$;
```

- [ ] **Step 2: Apply on dev** (operator CLI / MCP per runbook).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0107_posts_realtime_publication.sql
git commit -m "chore(infra): add posts to supabase_realtime publication"
```

---

### Task 2: Application ports — `IPostRealtime` + `IUserRealtime`

**Files:**
- Create: `app/packages/application/src/ports/IPostRealtime.ts`
- Create: `app/packages/application/src/ports/IUserRealtime.ts`
- Modify: `app/packages/application/src/index.ts`
- Modify: `app/packages/application/src/ports/IFeedRealtime.ts` — add `@deprecated Use IPostRealtime` (keep export until Task 8 removes callers)

- [ ] **Step 1: `IPostRealtime`**

```typescript
export type PostChangeEvent =
  | { kind: 'insert'; postId: string }
  | { kind: 'update'; postId: string }
  | { kind: 'delete'; postId: string };

export interface PostRealtimeCallbacks {
  onPostChange: (event: PostChangeEvent) => void;
  onError?: (error: Error) => void;
}

export interface IPostRealtime {
  /** Public open posts — feed INSERT signal (visibility=Public filter server-side). */
  subscribeToPublicInserts(cb: PostRealtimeCallbacks): () => void;
  /** All mutations on posts owned by userId (profile grids). */
  subscribeToOwnerPosts(userId: string, cb: PostRealtimeCallbacks): () => void;
  /** Single post while detail screen open (phase 2 may move call site only). */
  subscribeToPost(postId: string, cb: PostRealtimeCallbacks): () => void;
}
```

- [ ] **Step 2: `IUserRealtime`**

```typescript
export interface UserRealtimeCallbacks {
  onUserUpdated: (payload: {
    userId: string;
    followersCount?: number;
    followingCount?: number;
    activePostsCountInternal?: number;
    activePostsCountPublic?: number;
  }) => void;
  onError?: (error: Error) => void;
}

export interface IUserRealtime {
  subscribeToUser(userId: string, cb: UserRealtimeCallbacks): () => void;
}
```

- [ ] **Step 3: Export from `index.ts`**

- [ ] **Step 4: Commit** `feat(contract): add IPostRealtime and IUserRealtime ports`

---

### Task 3: `SupabasePostRealtime` adapter

**Files:**
- Create: `app/packages/infrastructure-supabase/src/feed/SupabasePostRealtime.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`
- Keep: `SupabaseFeedRealtime.ts` as thin re-export delegating to `SupabasePostRealtime` until Task 8 (avoid breaking imports mid-PR)

- [ ] **Step 1: Implement** (copy channel-uniqueness pattern from `SupabaseFeedRealtime.ts` + `SupabaseChatRealtime.ts`)

Handlers call `cb.onPostChange({ kind: 'insert' | 'update' | 'delete', postId })` extracted from `payload.new` / `payload.old`.

Filters:
- Public inserts: `table: 'posts', filter: 'visibility=eq.Public'` event INSERT
- Owner: `filter: 'owner_id=eq.${userId}'` events INSERT,UPDATE,DELETE
- Single post: `filter: 'post_id=eq.${postId}'` — use primary key column name from schema (`id` vs `post_id` — **verify in `database.types`** before coding)

- [ ] **Step 2: Unit tests** — clone structure from `SupabaseFeedRealtime.test.ts`; assert unique topics per `subscribe*` call and `removeChannel` on unsubscribe.

- [ ] **Step 3: Run**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabasePostRealtime
```

Expected: PASS

- [ ] **Step 4: Commit** `feat(infra): add SupabasePostRealtime adapter`

---

### Task 4: `SupabaseUserRealtime` adapter

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts`
- Create: `app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts`

- [ ] **Step 1: Implement** `subscribeToUser(userId)` → `users` UPDATE `id=eq.${userId}`; map numeric counter fields from row.

- [ ] **Step 2: Tests + commit** `feat(infra): add SupabaseUserRealtime adapter`

---

### Task 5: `debounceAsync` utility

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/debounceAsync.ts`
- Create: `app/apps/mobile/src/lib/realtime/__tests__/debounceAsync.test.ts`

- [ ] **Step 1: Implementation**

```typescript
export function debounceAsync<T>(
  fn: () => Promise<T>,
  waitMs: number,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<T> | null = null;

  const run = () => {
    if (inFlight) return;
    inFlight = fn().finally(() => {
      inFlight = null;
    });
  };

  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      run();
    }, waitMs);
  };
}
```

- [ ] **Step 2: Test** — 5 rapid calls within 250ms → `fn` invoked once.

- [ ] **Step 3: Commit** `feat(mobile): add debounceAsync for realtime handlers`

---

### Task 6: `feedCacheSync` — IG-style merge rules

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/feedCacheSync.ts`
- Create: `app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts`

- [ ] **Step 1: Write failing tests**

Cases:
1. `prependPostToFeedCache` — dedupes by `postId`, prepends to `data.posts`, leaves `nextCursor` unchanged.
2. `patchPostInFeedCache` — maps matching id.
3. `removePostFromFeedCache` — filters out id.
4. `postMatchesClientFeedFilter(post, filter)` — cheap predicate mirroring mobile `feedFilter` shape (type, statusFilter, followersOnly flag); **full parity with SQL deferred** — document gaps in test name.

- [ ] **Step 2: Implement helpers** using `QueryClient` + `QueryKey` `['feed', viewerId, feedFilter]`.

- [ ] **Step 3: Run**

```bash
cd app && pnpm --filter @kc/mobile test -- feedCacheSync
```

- [ ] **Step 4: Commit** `feat(mobile): feed cache sync helpers for realtime`

---

### Task 7: `feedSessionStore` — queue, not just count

**Files:**
- Modify: `app/apps/mobile/src/store/feedSessionStore.ts`

- [ ] **Step 1: Add**

```typescript
queuedPostIds: string[];
enqueuePostId: (id: string) => void;
clearQueue: () => void;
```

Keep `newPostsCount` as **derived** `queuedPostIds.length` for `NewPostsBanner` compatibility, or replace usages with `queuedPostIds.length`.

- [ ] **Step 2: Commit** `refactor(mobile): feed session queue for scroll-down pill`

---

### Task 8: `RealtimeSyncCoordinator`

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts`
- Create: `app/apps/mobile/src/lib/realtime/useRealtimeSync.ts`
- Modify: `app/apps/mobile/src/services/postsComposition.ts` — `getPostRealtime()`, `getUserRealtime()`
- Modify: `app/apps/mobile/src/services/userComposition.ts` — export user realtime getter

- [ ] **Step 1: Coordinator API**

```typescript
export class RealtimeSyncCoordinator {
  constructor(
    private readonly queryClient: QueryClient,
    private readonly postRt: IPostRealtime,
    private readonly userRt: IUserRealtime,
  ) {}

  start(viewerId: string): void;
  stop(): void; // all unsub + clear timers
  /** Called from feed screen */
  setFeedContext(ctx: {
    isFocused: boolean;
    scrollOffsetY: number;
    viewerId: string | null;
    feedFilter: PostFeedFilter;
  }): void;
  /** Flush queued inserts when user taps pill or scrolls to top */
  flushQueuedFeedPosts(): Promise<void>;
}
```

**Internal behavior (phase 1):**
- `start`: subscribe `userRt.subscribeToUser(viewerId)` → `setQueryData(['user-profile', viewerId], merge counters)`.
- `start`: subscribe `postRt.subscribeToOwnerPosts(viewerId)` → debounced 500ms invalidate `['my-posts']`, `['profile-closed-posts']`, `['my-hidden-open-posts']` (prefix match).
- `start`: subscribe `postRt.subscribeToPublicInserts` → debounced 250ms → `handlePublicInsert(postId)`.
- `handlePublicInsert`:
  - If `!feedContext.isFocused` → return.
  - If `scrollOffsetY > 80` → `enqueuePostId(postId)`.
  - Else → `await hydrateAndPrepend(postId)` (`getPostByIdUseCase`; skip if `!postMatchesClientFeedFilter`).
- `handleOwnerPostChange` (update/delete): if post in feed cache → patch/remove via `feedCacheSync`.
- **AppState:** reuse 60s background disconnect logic from `useFeedRealtime.ts` (move here); on resume after disconnect → `invalidateQueries({ queryKey: ['feed'], exact: false })` once.

- [ ] **Step 2: `useRealtimeSync`** — `useEffect` in `AuthGate` calls `coordinator.start/stop` with `session.userId` (skip ghost session).

- [ ] **Step 3: Unit test** coordinator logic with mocked ports (no Supabase): 3 insert events in 100ms → one hydrate call.

- [ ] **Step 4: Commit** `feat(mobile): RealtimeSyncCoordinator for feed and profile`

---

### Task 9: Wire Home Feed screen

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`
- Delete or gut: `app/apps/mobile/src/hooks/useFeedRealtime.ts`

- [ ] **Step 1: Track scroll offset**

```typescript
const scrollOffsetRef = useRef(0);
const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
  scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  getRealtimeCoordinator().setFeedContext({
    isFocused: true, // or useIsFocused()
    scrollOffsetY: scrollOffsetRef.current,
    viewerId,
    feedFilter,
  });
}, [viewerId, feedFilter]);
```

Pass `onScroll` to `PostFeedList` (add prop if missing).

- [ ] **Step 2: `useFocusEffect`** — set `isFocused` true/false on coordinator.

- [ ] **Step 3: `NewPostsBanner`** — `onPress` calls `flushQueuedFeedPosts()` then scroll to top (existing behavior).

- [ ] **Step 4: Remove `useFeedRealtime(refetchAndReset)`** — pull-to-refresh still calls `feedQuery.refetch()` only.

- [ ] **Step 5: Manual QA checklist**
  - Device A at top of feed, Device B publishes public post → A sees prepend without pull.
  - A scrolled down → pill appears → tap → posts appear at top.
  - Background >60s → foreground → one refetch, no duplicate channels (check Metro log in `__DEV__`).

- [ ] **Step 6: Commit** `feat(mobile): IG-style feed merge via RealtimeSyncCoordinator`

---

### Task 10: Profile counters (my profile)

**Files:**
- Modify: `app/apps/mobile/src/components/profile/MyProfileChrome.tsx` (no subscription here — coordinator already updates `['user-profile', userId]`)

- [ ] **Step 1: Verify** `userQuery` uses `['user-profile', userId]` — counters re-render when coordinator merges.

- [ ] **Step 2: Manual QA** — second device closes post → open posts grid and counter update within ~2s without pull.

- [ ] **Step 3: Commit** (if only comments) or skip empty commit.

---

### Task 11: List performance guard (TD-126 slice)

**Files:**
- Modify: `app/apps/mobile/src/components/PostCard.tsx` — wrap export in `React.memo`
- Modify: `app/apps/mobile/src/components/PostFeedList.tsx` — stable `renderItem` via `useCallback`

- [ ] **Step 1: memo + compare** — shallow compare `post.postId` + key display fields.

- [ ] **Step 2: Smoke test** — scroll feed with 20 items, prepend one post, confirm no full-list flicker (visual).

- [ ] **Step 3: Commit** `perf(mobile): memo PostCard for realtime prepend`

---

### Task 12: Phase 1 verification gate

- [ ] **Run from `app/`:**

```bash
pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Update SSOT** — FR-FEED-009 status note; close TD-105 counter slice in `TECH_DEBT.md`; mark BACKLOG item done.

- [ ] **PR** — single PR `feat/FR-FEED-009-realtime-coordinator-phase1` to `dev`.

---

## Phase 2 — Other profile + Post detail (lighter epic)

**Goal:** Same coordinator pattern; **no new global channels** beyond the 4-cap (detail channel only while mounted).

| Task | Summary |
|------|---------|
| 2.1 | `useOtherProfileRealtime(handle)` — on focus resolve `userId`, call `coordinator.watchOtherUser(userId)` / unwatch on blur |
| 2.2 | Invalidate `['profile-other', handle]`, `['profile-other-posts', userId]`, `['profile-other-post-count', userId]` debounced 500ms |
| 2.3 | `app/post/[id].tsx` — `subscribeToPost` on mount; `invalidateQueries(['post', postId, ...])` on update/delete |
| 2.4 | Manual QA + PR `feat/FR-FEED-009-realtime-phase2` |

---

## Phase 3 — Rest of app (only if phase 1–2 stable)

| Surface | Mechanism |
|---------|-----------|
| Follow requests | Migration add table to publication; coordinator invalidates `['pending-requests']` |
| Notifications list | Same |
| Stats screen | On `users` UPDATE (already subscribed for self) extend merge to invalidate `['my-activity-timeline']` — closes TD-98 slice |

**Gate:** Phase 3 starts only after 1 week without Realtime-related Sentry noise / PM sign-off.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Filter mismatch (prepend wrong post) | Always `getPostById` + `postMatchesClientFeedFilter`; drop on failure |
| Channel leak on sign-out | `coordinator.stop()` in same `AuthGate` effect as chat reset |
| N+1 REST under load | 250ms debounce; max 1 hydrate per window |
| `posts` not in publication on prod | Migration + operator runbook check |
| Over-engineering | Phase 3 gated; no global entity store |

---

## Execution handoff

**Plan saved to** `docs/superpowers/plans/2026-05-24-app-realtime-sync.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — one fresh subagent per task above, review between tasks.
2. **Inline Execution** — implement Phase 1 in this session with checkpoints after Tasks 3, 8, 12.

Which approach do you want?
