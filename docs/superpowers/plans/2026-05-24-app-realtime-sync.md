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
| DB | `supabase/migrations/0108_posts_realtime_publication.sql` |
| Ports | `app/packages/application/src/ports/IPostRealtime.ts`, `IUserRealtime.ts` |
| Infra | `app/packages/infrastructure-supabase/src/feed/SupabasePostRealtime.ts` (new; supersedes `SupabaseFeedRealtime.ts`), `.../users/SupabaseUserRealtime.ts` |
| Infra tests | `.../feed/__tests__/SupabasePostRealtime.test.ts`, `.../users/__tests__/SupabaseUserRealtime.test.ts` |
| Mobile lib | `app/apps/mobile/src/lib/realtime/debounceAsync.ts`, `feedCacheSync.ts`, `profileCacheSync.ts` |
| Mobile lib tests | `app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts`, `debounceAsync.test.ts` |
| Coordinator | `app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts`, `useRealtimeSync.ts` |
| Composition | `app/apps/mobile/src/services/postsComposition.ts`, `userComposition.ts` |
| Wire | `app/apps/mobile/src/components/AuthGate.tsx` |
| Feed screen | `app/apps/mobile/app/(tabs)/index.tsx` |
| Deprecate | `app/apps/mobile/src/hooks/useFeedRealtime.ts` (deleted in Task 9); `getFeedRealtime()` removed from `postsComposition.ts` and `SupabaseFeedRealtime` export removed from `infrastructure-supabase/src/index.ts` (file kept on disk for a follow-up `chore` PR) |
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
- Create: `supabase/migrations/0108_posts_realtime_publication.sql`

> **Verified ground truth (2026-05-24):** highest existing migration is `0107_profile_closed_posts_surface_visibility.sql`. Next free number is `0108`. `users` is already in `supabase_realtime` (added in `0007`), so this migration covers `posts` only.

- [ ] **Step 1: Write migration**

```sql
-- 0108_posts_realtime_publication | FR-FEED-009, FR-PROFILE-013
-- Idempotent add of public.posts to supabase_realtime (same pattern as 0007).

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

- [ ] **Step 2: Apply on dev via Supabase MCP**

Call `mcp__supabase__apply_migration` with `name="0108_posts_realtime_publication"` and `query=<file contents>`. (Dev project ref `roeefqpdbftlndzsvhfj` — CLAUDE.md §13 grants write authority.)

Then verify:

```bash
# Confirm posts is now in the publication
# Run via mcp__supabase__execute_sql:
#   select schemaname, tablename from pg_publication_tables
#   where pubname = 'supabase_realtime' and tablename = 'posts';
```

Expected: one row `(public, posts)`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_posts_realtime_publication.sql
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
- Create: `app/packages/infrastructure-supabase/src/feed/__tests__/SupabasePostRealtime.test.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts` — export `SupabasePostRealtime`
- Keep: `SupabaseFeedRealtime.ts` and its test untouched in this PR (Task 9 removes the last consumer; the deprecated re-export decision is deferred until then to keep this PR small)

> **Verified ground truth (2026-05-24):** PK column on `public.posts` is `post_id` (not `id`). Confirmed in `app/packages/infrastructure-supabase/src/database.types.ts:681`. Realtime `postgres_changes` payload exposes the row under `payload.new` (INSERT/UPDATE) and `payload.old` (DELETE). On DELETE only PK and replica-identity columns are guaranteed present.

- [ ] **Step 1: Write the failing test**

Create `app/packages/infrastructure-supabase/src/feed/__tests__/SupabasePostRealtime.test.ts`. Re-use the `makeFakeClient()` helper pattern from `SupabaseFeedRealtime.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePostRealtime } from '../SupabasePostRealtime';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnCall { event: string; config: any; handler: (payload: unknown) => void }
interface FakeChannel { topic: string; onCalls: OnCall[]; statusCb?: (s: string) => void }
interface FakeClient { client: SupabaseClient<any>; channels: FakeChannel[]; removed: FakeChannel[] }

function makeFakeClient(): FakeClient {
  const channels: FakeChannel[] = [];
  const removed: FakeChannel[] = [];
  const builderToFc = new WeakMap<object, FakeChannel>();
  const client = {
    channel: (topic: string) => {
      const fc: FakeChannel = { topic, onCalls: [] };
      channels.push(fc);
      const builder: any = {
        on: (event: string, config: any, handler: (p: unknown) => void) => {
          fc.onCalls.push({ event, config, handler });
          return builder;
        },
        subscribe: (statusCb: (s: string) => void) => { fc.statusCb = statusCb; return builder; },
      };
      builderToFc.set(builder, fc);
      return builder;
    },
    removeChannel: (ch: object) => { const fc = builderToFc.get(ch); if (fc) removed.push(fc); return Promise.resolve(); },
  } as unknown as SupabaseClient<any>;
  return { client, channels, removed };
}

describe('SupabasePostRealtime', () => {
  describe('subscribeToPublicInserts', () => {
    it('creates a unique topic and registers an INSERT filter on visibility=Public', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      rt.subscribeToPublicInserts({ onPostChange: vi.fn() });
      rt.subscribeToPublicInserts({ onPostChange: vi.fn() });
      expect(channels).toHaveLength(2);
      expect(channels[0]!.topic).toMatch(/^posts:public-insert:[a-z0-9]+$/);
      expect(channels[0]!.topic).not.toBe(channels[1]!.topic);
      expect(channels[0]!.onCalls[0]!.config).toEqual({
        event: 'INSERT', schema: 'public', table: 'posts', filter: 'visibility=eq.Public',
      });
    });

    it('emits insert events with the post_id from payload.new', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const onPostChange = vi.fn();
      rt.subscribeToPublicInserts({ onPostChange });
      channels[0]!.onCalls[0]!.handler({ new: { post_id: 'p1' } });
      expect(onPostChange).toHaveBeenCalledWith({ kind: 'insert', postId: 'p1' });
    });

    it('drops the event when payload.new is missing post_id (defensive — should never happen with proper RLS, but cheap to guard)', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const onPostChange = vi.fn();
      rt.subscribeToPublicInserts({ onPostChange });
      channels[0]!.onCalls[0]!.handler({ new: {} });
      expect(onPostChange).not.toHaveBeenCalled();
    });

    it('unsubscribe removes the channel', () => {
      const { client, channels, removed } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const unsub = rt.subscribeToPublicInserts({ onPostChange: vi.fn() });
      unsub();
      expect(removed).toEqual([channels[0]]);
    });
  });

  describe('subscribeToOwnerPosts', () => {
    it('registers INSERT, UPDATE and DELETE listeners filtered by owner_id', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      rt.subscribeToOwnerPosts('u1', { onPostChange: vi.fn() });
      const ch = channels[0]!;
      const events = ch.onCalls.map((c) => c.config.event).sort();
      expect(events).toEqual(['DELETE', 'INSERT', 'UPDATE']);
      for (const call of ch.onCalls) {
        expect(call.config).toMatchObject({
          schema: 'public', table: 'posts', filter: 'owner_id=eq.u1',
        });
      }
    });

    it('emits update/delete events with the right kind and postId', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const onPostChange = vi.fn();
      rt.subscribeToOwnerPosts('u1', { onPostChange });
      const byEvent = Object.fromEntries(channels[0]!.onCalls.map((c) => [c.config.event, c.handler]));
      byEvent.UPDATE!({ new: { post_id: 'p2' } });
      byEvent.DELETE!({ old: { post_id: 'p3' } });
      expect(onPostChange).toHaveBeenNthCalledWith(1, { kind: 'update', postId: 'p2' });
      expect(onPostChange).toHaveBeenNthCalledWith(2, { kind: 'delete', postId: 'p3' });
    });
  });

  describe('subscribeToPost', () => {
    it('filters on post_id and reports update/delete', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const onPostChange = vi.fn();
      rt.subscribeToPost('p9', { onPostChange });
      const ch = channels[0]!;
      for (const call of ch.onCalls) {
        expect(call.config.filter).toBe('post_id=eq.p9');
      }
      const byEvent = Object.fromEntries(ch.onCalls.map((c) => [c.config.event, c.handler]));
      byEvent.UPDATE!({ new: { post_id: 'p9' } });
      expect(onPostChange).toHaveBeenCalledWith({ kind: 'update', postId: 'p9' });
    });
  });

  describe('subscribe status', () => {
    it('reports CHANNEL_ERROR / TIMED_OUT through onError when provided, no-ops otherwise', () => {
      const { client, channels } = makeFakeClient();
      const rt = new SupabasePostRealtime(client);
      const onError = vi.fn();
      rt.subscribeToPublicInserts({ onPostChange: vi.fn(), onError });
      channels[0]!.statusCb!('CHANNEL_ERROR');
      channels[0]!.statusCb!('TIMED_OUT');
      channels[0]!.statusCb!('SUBSCRIBED');
      expect(onError).toHaveBeenCalledTimes(2);
      rt.subscribeToPublicInserts({ onPostChange: vi.fn() });
      expect(() => channels[1]!.statusCb!('CHANNEL_ERROR')).not.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabasePostRealtime
```

Expected: FAIL with `Cannot find module '../SupabasePostRealtime'`.

- [ ] **Step 3: Implement the adapter**

Create `app/packages/infrastructure-supabase/src/feed/SupabasePostRealtime.ts`:

```typescript
// SupabasePostRealtime — adapter for IPostRealtime.
// Mapped to FR-FEED-009 / FR-PROFILE-013. Supersedes SupabaseFeedRealtime
// once all callers migrate (see plan Task 9).
//
// Channel-uniqueness pattern (random topic suffix) mirrors
// SupabaseFeedRealtime: the realtime client caches channels by topic in
// `client.channels`, and reusing a stale topic after unsubscribe throws
// "cannot add postgres_changes callbacks after subscribe()".

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IPostRealtime,
  PostRealtimeCallbacks,
  PostChangeEvent,
} from '@kc/application';
import type { Database } from '../database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type Payload = { new?: Partial<PostRow>; old?: Partial<PostRow> };

function suffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emit(
  cb: PostRealtimeCallbacks,
  kind: PostChangeEvent['kind'],
  payload: Payload,
): void {
  const row = kind === 'delete' ? payload.old : payload.new;
  const postId = row?.post_id;
  if (typeof postId !== 'string' || postId.length === 0) return;
  cb.onPostChange({ kind, postId });
}

function reportStatus(cb: PostRealtimeCallbacks, label: string, status: string): void {
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    cb.onError?.(new Error(`${label} channel ${status.toLowerCase()}`));
  }
}

export class SupabasePostRealtime implements IPostRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToPublicInserts(cb: PostRealtimeCallbacks): () => void {
    const topic = `posts:public-insert:${suffix()}`;
    const channel = this.client
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: 'visibility=eq.Public' },
        (payload) => emit(cb, 'insert', payload as Payload),
      )
      .subscribe((status) => reportStatus(cb, 'posts:public-insert', status));
    return () => { void this.client.removeChannel(channel); };
  }

  subscribeToOwnerPosts(userId: string, cb: PostRealtimeCallbacks): () => void {
    const topic = `posts:owner:${userId}:${suffix()}`;
    const filter = `owner_id=eq.${userId}`;
    const channel = this.client
      .channel(topic)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter },
        (p) => emit(cb, 'insert', p as Payload))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter },
        (p) => emit(cb, 'update', p as Payload))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts', filter },
        (p) => emit(cb, 'delete', p as Payload))
      .subscribe((status) => reportStatus(cb, `posts:owner:${userId}`, status));
    return () => { void this.client.removeChannel(channel); };
  }

  subscribeToPost(postId: string, cb: PostRealtimeCallbacks): () => void {
    const topic = `posts:single:${postId}:${suffix()}`;
    const filter = `post_id=eq.${postId}`;
    const channel = this.client
      .channel(topic)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter },
        (p) => emit(cb, 'update', p as Payload))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts', filter },
        (p) => emit(cb, 'delete', p as Payload))
      .subscribe((status) => reportStatus(cb, `posts:single:${postId}`, status));
    return () => { void this.client.removeChannel(channel); };
  }
}
```

- [ ] **Step 4: Export from `index.ts`**

In `app/packages/infrastructure-supabase/src/index.ts`, alongside the existing `SupabaseFeedRealtime` export, add:

```typescript
export { SupabasePostRealtime } from './feed/SupabasePostRealtime';
```

- [ ] **Step 5: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabasePostRealtime
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/packages/infrastructure-supabase/src/feed/SupabasePostRealtime.ts \
        app/packages/infrastructure-supabase/src/feed/__tests__/SupabasePostRealtime.test.ts \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabasePostRealtime adapter"
```

---

### Task 4: `SupabaseUserRealtime` adapter

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts`
- Create: `app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts` — export `SupabaseUserRealtime`

> **Verified ground truth (2026-05-24):** counter columns on `public.users` (per `database.types.ts:1037-1094`) — `followers_count`, `following_count`, `active_posts_count_internal`, `active_posts_count_public_open`, `active_posts_count_followers_only_open`. The plan's `IUserRealtime` callback shape uses `activePostsCountPublic` (= `active_posts_count_public_open`); `followersOnlyOpen` is intentionally omitted from phase 1 — re-add if a future UI surface needs it.

- [ ] **Step 1: Write the failing test**

Create `app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts`. Reuse the same `makeFakeClient()` helper inlined (or extract to a shared test-utils module if a third adapter test appears):

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUserRealtime } from '../SupabaseUserRealtime';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnCall { event: string; config: any; handler: (p: unknown) => void }
interface FakeChannel { topic: string; onCalls: OnCall[]; statusCb?: (s: string) => void }

function makeFakeClient() {
  const channels: FakeChannel[] = [];
  const removed: FakeChannel[] = [];
  const builderToFc = new WeakMap<object, FakeChannel>();
  const client = {
    channel: (topic: string) => {
      const fc: FakeChannel = { topic, onCalls: [] };
      channels.push(fc);
      const builder: any = {
        on: (event: string, config: any, handler: (p: unknown) => void) => {
          fc.onCalls.push({ event, config, handler }); return builder;
        },
        subscribe: (cb: (s: string) => void) => { fc.statusCb = cb; return builder; },
      };
      builderToFc.set(builder, fc); return builder;
    },
    removeChannel: (ch: object) => {
      const fc = builderToFc.get(ch); if (fc) removed.push(fc); return Promise.resolve();
    },
  } as unknown as SupabaseClient<any>;
  return { client, channels, removed };
}

describe('SupabaseUserRealtime.subscribeToUser', () => {
  it('subscribes to UPDATE on users filtered by id', () => {
    const { client, channels } = makeFakeClient();
    new SupabaseUserRealtime(client).subscribeToUser('u1', { onUserUpdated: vi.fn() });
    expect(channels[0]!.topic).toMatch(/^users:single:u1:[a-z0-9]+$/);
    expect(channels[0]!.onCalls[0]!.config).toEqual({
      event: 'UPDATE', schema: 'public', table: 'users', filter: 'id=eq.u1',
    });
  });

  it('produces a unique topic per subscription', () => {
    const { client, channels } = makeFakeClient();
    const rt = new SupabaseUserRealtime(client);
    rt.subscribeToUser('u1', { onUserUpdated: vi.fn() });
    rt.subscribeToUser('u1', { onUserUpdated: vi.fn() });
    expect(channels[0]!.topic).not.toBe(channels[1]!.topic);
  });

  it('maps the counter columns from payload.new to the callback shape', () => {
    const { client, channels } = makeFakeClient();
    const onUserUpdated = vi.fn();
    new SupabaseUserRealtime(client).subscribeToUser('u1', { onUserUpdated });
    channels[0]!.onCalls[0]!.handler({
      new: {
        id: 'u1',
        followers_count: 12,
        following_count: 7,
        active_posts_count_internal: 4,
        active_posts_count_public_open: 3,
      },
    });
    expect(onUserUpdated).toHaveBeenCalledWith({
      userId: 'u1',
      followersCount: 12,
      followingCount: 7,
      activePostsCountInternal: 4,
      activePostsCountPublic: 3,
    });
  });

  it('omits absent counters rather than emitting undefined keys', () => {
    const { client, channels } = makeFakeClient();
    const onUserUpdated = vi.fn();
    new SupabaseUserRealtime(client).subscribeToUser('u1', { onUserUpdated });
    channels[0]!.onCalls[0]!.handler({ new: { id: 'u1', followers_count: 5 } });
    expect(onUserUpdated).toHaveBeenCalledWith({ userId: 'u1', followersCount: 5 });
  });

  it('drops the event when payload.new is missing id', () => {
    const { client, channels } = makeFakeClient();
    const onUserUpdated = vi.fn();
    new SupabaseUserRealtime(client).subscribeToUser('u1', { onUserUpdated });
    channels[0]!.onCalls[0]!.handler({ new: { followers_count: 1 } });
    expect(onUserUpdated).not.toHaveBeenCalled();
  });

  it('unsubscribe removes the channel', () => {
    const { client, channels, removed } = makeFakeClient();
    const unsub = new SupabaseUserRealtime(client).subscribeToUser('u1', { onUserUpdated: vi.fn() });
    unsub();
    expect(removed).toEqual([channels[0]]);
  });

  it('reports CHANNEL_ERROR / TIMED_OUT via onError; no-ops without onError', () => {
    const { client, channels } = makeFakeClient();
    const onError = vi.fn();
    const rt = new SupabaseUserRealtime(client);
    rt.subscribeToUser('u1', { onUserUpdated: vi.fn(), onError });
    channels[0]!.statusCb!('CHANNEL_ERROR');
    expect(onError).toHaveBeenCalledTimes(1);
    rt.subscribeToUser('u1', { onUserUpdated: vi.fn() });
    expect(() => channels[1]!.statusCb!('TIMED_OUT')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseUserRealtime
```

Expected: FAIL with `Cannot find module '../SupabaseUserRealtime'`.

- [ ] **Step 3: Implement the adapter**

Create `app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts`:

```typescript
// SupabaseUserRealtime — adapter for IUserRealtime.
// Mapped to FR-PROFILE-013 AC5 (counter freshness) + FR-FEED-009 amendment.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IUserRealtime,
  UserRealtimeCallbacks,
} from '@kc/application';
import type { Database } from '../database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type Payload = { new?: Partial<UserRow> };

function suffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class SupabaseUserRealtime implements IUserRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToUser(userId: string, cb: UserRealtimeCallbacks): () => void {
    const topic = `users:single:${userId}:${suffix()}`;
    const channel = this.client
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          const row = (payload as Payload).new;
          if (!row || typeof row.id !== 'string') return;
          const out: Parameters<UserRealtimeCallbacks['onUserUpdated']>[0] = { userId: row.id };
          if (typeof row.followers_count === 'number') out.followersCount = row.followers_count;
          if (typeof row.following_count === 'number') out.followingCount = row.following_count;
          if (typeof row.active_posts_count_internal === 'number') {
            out.activePostsCountInternal = row.active_posts_count_internal;
          }
          if (typeof row.active_posts_count_public_open === 'number') {
            out.activePostsCountPublic = row.active_posts_count_public_open;
          }
          cb.onUserUpdated(out);
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError?.(new Error(`users:single:${userId} channel ${status.toLowerCase()}`));
        }
      });

    return () => { void this.client.removeChannel(channel); };
  }
}
```

- [ ] **Step 4: Export from `index.ts`**

```typescript
export { SupabaseUserRealtime } from './users/SupabaseUserRealtime';
```

- [ ] **Step 5: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseUserRealtime
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts \
        app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseUserRealtime adapter"
```

---

### Task 5: `debounceAsync` utility

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/debounceAsync.ts`
- Create: `app/apps/mobile/src/lib/realtime/__tests__/debounceAsync.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounceAsync } from '../debounceAsync';

describe('debounceAsync', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('coalesces a burst of trigger calls into a single fn invocation per window', () => {
    const fn = vi.fn(async () => 'ok');
    const trigger = debounceAsync(fn, 250);
    for (let i = 0; i < 5; i++) trigger();
    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('starts a new window after the previous flush', async () => {
    const fn = vi.fn(async () => 'ok');
    const trigger = debounceAsync(fn, 100);
    trigger();
    vi.advanceTimersByTime(100);
    await Promise.resolve();
    trigger();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not start fn a second time while a previous invocation is still in-flight', async () => {
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    const trigger = debounceAsync(fn, 50);
    trigger();
    vi.advanceTimersByTime(50);
    trigger();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.resolve();
    trigger();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd app && pnpm --filter @kc/mobile test -- debounceAsync
```

Expected: FAIL with `Cannot find module '../debounceAsync'`.

- [ ] **Step 3: Implement**

```typescript
// debounceAsync — trailing-edge debounce with in-flight guard.
// Used by RealtimeSyncCoordinator to coalesce a burst of postgres_changes
// events into a single REST call per window (FR-FEED-009 perf guardrail).

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

- [ ] **Step 4: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/mobile test -- debounceAsync
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/lib/realtime/debounceAsync.ts \
        app/apps/mobile/src/lib/realtime/__tests__/debounceAsync.test.ts
git commit -m "feat(mobile): add debounceAsync for realtime handlers"
```

---

### Task 6: `feedCacheSync` — IG-style merge rules

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/feedCacheSync.ts`
- Create: `app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts`

> **Verified ground truth (2026-05-24):** Home Feed uses `useQuery` (not `useInfiniteQuery`) with `queryKey: ['feed', viewerId, feedFilter]` (`app/apps/mobile/app/(tabs)/index.tsx:65`). Cache value shape is `FeedPage = { posts: PostWithOwner[]; nextCursor: string | null }` (`packages/application/src/ports/IPostRepository.ts:40`). Helpers update every cached entry whose key starts with `['feed', viewerId, ...]` (filter dimension may differ between filter changes), via `queryClient.setQueriesData`. **Client filter predicate caveat:** mirrors `feedFilter` shape (`type`, `statusFilter`, `followersOnly`); proximity radius and full block-list parity are **not** re-checked here — coordinator gates inserts behind a successful `getPostById` (which runs server RLS), so this predicate is a cheap pre-filter only.

- [ ] **Step 1: Write failing tests**

Create `app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { FeedPage, PostWithOwner } from '@kc/application';
import {
  prependPostToFeedCache,
  patchPostInFeedCache,
  removePostFromFeedCache,
  postMatchesClientFeedFilter,
  type ClientFeedFilter,
} from '../feedCacheSync';

function makePost(over: Partial<PostWithOwner>): PostWithOwner {
  return {
    postId: 'p1',
    ownerId: 'o1',
    type: 'Give',
    status: 'Active',
    title: 't',
    description: null,
    category: 'c',
    visibility: 'Public',
    city: 'TLV',
    street: 's',
    streetNumber: '1',
    locationDisplayLevel: 'city',
    itemCondition: null,
    urgency: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    owner: { userId: 'o1', displayName: 'o', avatarUrl: null },
    ...over,
  } as PostWithOwner;
}
function seed(qc: QueryClient, viewerId: string, filter: object, page: FeedPage) {
  qc.setQueryData(['feed', viewerId, filter], page);
}
function read(qc: QueryClient, viewerId: string, filter: object): FeedPage | undefined {
  return qc.getQueryData<FeedPage>(['feed', viewerId, filter]);
}

describe('feedCacheSync.prependPostToFeedCache', () => {
  it('prepends the post to every cached feed page for viewerId', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', { type: 'Give' }, { posts: [makePost({ postId: 'a' })], nextCursor: 'C' });
    seed(qc, 'v1', { type: 'Take' }, { posts: [], nextCursor: null });
    prependPostToFeedCache(qc, 'v1', makePost({ postId: 'NEW' }));
    expect(read(qc, 'v1', { type: 'Give' })?.posts.map((p) => p.postId)).toEqual(['NEW', 'a']);
    expect(read(qc, 'v1', { type: 'Take' })?.posts.map((p) => p.postId)).toEqual(['NEW']);
  });

  it('preserves nextCursor (do not invalidate pagination on prepend)', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', {}, { posts: [], nextCursor: 'KEEP' });
    prependPostToFeedCache(qc, 'v1', makePost({ postId: 'NEW' }));
    expect(read(qc, 'v1', {})?.nextCursor).toBe('KEEP');
  });

  it('dedupes by postId when the post is already in the cache', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', {}, { posts: [makePost({ postId: 'X' })], nextCursor: null });
    prependPostToFeedCache(qc, 'v1', makePost({ postId: 'X', title: 'updated' }));
    const posts = read(qc, 'v1', {})?.posts ?? [];
    expect(posts).toHaveLength(1);
    expect(posts[0]!.title).toBe('updated');
  });

  it('does not touch other viewers caches', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', {}, { posts: [], nextCursor: null });
    seed(qc, 'v2', {}, { posts: [makePost({ postId: 'v2only' })], nextCursor: null });
    prependPostToFeedCache(qc, 'v1', makePost({ postId: 'NEW' }));
    expect(read(qc, 'v2', {})?.posts.map((p) => p.postId)).toEqual(['v2only']);
  });
});

describe('feedCacheSync.patchPostInFeedCache', () => {
  it('replaces the matching post in every cached feed page for viewerId', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', { type: 'Give' }, {
      posts: [makePost({ postId: 'X', title: 'old' }), makePost({ postId: 'Y' })],
      nextCursor: null,
    });
    patchPostInFeedCache(qc, 'v1', makePost({ postId: 'X', title: 'new' }));
    expect(read(qc, 'v1', { type: 'Give' })?.posts.find((p) => p.postId === 'X')?.title).toBe('new');
  });

  it('no-ops when the id is not present', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', {}, { posts: [makePost({ postId: 'A' })], nextCursor: null });
    patchPostInFeedCache(qc, 'v1', makePost({ postId: 'Z' }));
    expect(read(qc, 'v1', {})?.posts.map((p) => p.postId)).toEqual(['A']);
  });
});

describe('feedCacheSync.removePostFromFeedCache', () => {
  it('removes the matching post from every cached feed page', () => {
    const qc = new QueryClient();
    seed(qc, 'v1', {}, { posts: [makePost({ postId: 'A' }), makePost({ postId: 'B' })], nextCursor: null });
    removePostFromFeedCache(qc, 'v1', 'A');
    expect(read(qc, 'v1', {})?.posts.map((p) => p.postId)).toEqual(['B']);
  });
});

describe('feedCacheSync.postMatchesClientFeedFilter — cheap pre-filter (NOT a full SQL parity check; coordinator still calls getPostById)', () => {
  const base: ClientFeedFilter = {};
  it('returns true on empty filter', () => {
    expect(postMatchesClientFeedFilter(makePost({}), base)).toBe(true);
  });
  it('filters by type', () => {
    expect(postMatchesClientFeedFilter(makePost({ type: 'Give' }), { type: 'Take' })).toBe(false);
    expect(postMatchesClientFeedFilter(makePost({ type: 'Give' }), { type: 'Give' })).toBe(true);
  });
  it('filters by statusFilter', () => {
    expect(postMatchesClientFeedFilter(makePost({ status: 'Closed' }), { statusFilter: 'OpenOnly' })).toBe(false);
    expect(postMatchesClientFeedFilter(makePost({ status: 'Active' }), { statusFilter: 'OpenOnly' })).toBe(true);
  });
  it('filters out followers-only-only filter when post is Public (followersOnly=true means show only FO posts)', () => {
    expect(postMatchesClientFeedFilter(makePost({ visibility: 'Public' }), { followersOnly: true })).toBe(false);
    expect(postMatchesClientFeedFilter(makePost({ visibility: 'FollowersOnly' as any }), { followersOnly: true })).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && pnpm --filter @kc/mobile test -- feedCacheSync
```

Expected: FAIL with `Cannot find module '../feedCacheSync'`.

- [ ] **Step 3: Implement helpers**

Create `app/apps/mobile/src/lib/realtime/feedCacheSync.ts`:

```typescript
// feedCacheSync — targeted TanStack Query cache writes for the Home Feed.
// Mapped to FR-FEED-009 (amended): prepend/patch/remove without a full
// invalidate. Operates across all cached entries whose key starts with
// ['feed', viewerId, ...] (different filter dimensions = different cache
// entries — each must stay coherent).

import type { QueryClient } from '@tanstack/react-query';
import type { FeedPage, PostWithOwner } from '@kc/application';

export interface ClientFeedFilter {
  type?: 'Give' | 'Take';
  statusFilter?: 'OpenOnly' | 'ClosedOnly' | 'All';
  followersOnly?: boolean;
}

function updateFeedPages(
  queryClient: QueryClient,
  viewerId: string,
  mapper: (page: FeedPage) => FeedPage,
): void {
  queryClient.setQueriesData<FeedPage>(
    { queryKey: ['feed', viewerId], exact: false },
    (page) => (page ? mapper(page) : page),
  );
}

export function prependPostToFeedCache(
  queryClient: QueryClient,
  viewerId: string,
  post: PostWithOwner,
): void {
  updateFeedPages(queryClient, viewerId, (page) => {
    const idx = page.posts.findIndex((p) => p.postId === post.postId);
    const without = idx >= 0 ? page.posts.filter((p) => p.postId !== post.postId) : page.posts;
    return { posts: [post, ...without], nextCursor: page.nextCursor };
  });
}

export function patchPostInFeedCache(
  queryClient: QueryClient,
  viewerId: string,
  post: PostWithOwner,
): void {
  updateFeedPages(queryClient, viewerId, (page) => ({
    posts: page.posts.map((p) => (p.postId === post.postId ? post : p)),
    nextCursor: page.nextCursor,
  }));
}

export function removePostFromFeedCache(
  queryClient: QueryClient,
  viewerId: string,
  postId: string,
): void {
  updateFeedPages(queryClient, viewerId, (page) => ({
    posts: page.posts.filter((p) => p.postId !== postId),
    nextCursor: page.nextCursor,
  }));
}

export function postMatchesClientFeedFilter(
  post: PostWithOwner,
  filter: ClientFeedFilter,
): boolean {
  if (filter.type && post.type !== filter.type) return false;
  if (filter.statusFilter === 'OpenOnly' && post.status !== 'Active') return false;
  if (filter.statusFilter === 'ClosedOnly' && post.status === 'Active') return false;
  if (filter.followersOnly === true && post.visibility === 'Public') return false;
  return true;
}
```

- [ ] **Step 4: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/mobile test -- feedCacheSync
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/lib/realtime/feedCacheSync.ts \
        app/apps/mobile/src/lib/realtime/__tests__/feedCacheSync.test.ts
git commit -m "feat(mobile): feed cache sync helpers for realtime"
```

---

### Task 7: `feedSessionStore` — queue, not just count

**Files:**
- Modify: `app/apps/mobile/src/store/feedSessionStore.ts`
- Modify: `app/apps/mobile/src/store/__tests__/feedSessionStore.test.ts` — extend existing test file with queue cases

> **Verified ground truth (2026-05-24):** existing store has `newPostsCount: number`, `incrementNewPosts()`, `resetNewPosts()`. Strategy: replace `incrementNewPosts` with `enqueuePostId(id)` (dedupes); keep `newPostsCount` as a getter that returns `queuedPostIds.length` so `NewPostsBanner` doesn't change. `resetNewPosts()` becomes `clearQueue()` (rename callers in same commit). The coordinator (Task 8) is the only writer that calls `enqueuePostId`.

- [ ] **Step 1: Write failing tests for the queue API**

Append to `app/apps/mobile/src/store/__tests__/feedSessionStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useFeedSessionStore } from '../feedSessionStore';

describe('feedSessionStore — queued post ids', () => {
  beforeEach(() => { useFeedSessionStore.getState().clearQueue(); });

  it('enqueuePostId appends and dedupes', () => {
    const s = useFeedSessionStore.getState();
    s.enqueuePostId('a'); s.enqueuePostId('b'); s.enqueuePostId('a');
    expect(useFeedSessionStore.getState().queuedPostIds).toEqual(['a', 'b']);
  });

  it('newPostsCount mirrors queue length (back-compat for NewPostsBanner)', () => {
    const s = useFeedSessionStore.getState();
    s.enqueuePostId('a'); s.enqueuePostId('b');
    expect(useFeedSessionStore.getState().newPostsCount).toBe(2);
  });

  it('clearQueue empties both the queue and the derived count', () => {
    const s = useFeedSessionStore.getState();
    s.enqueuePostId('a');
    s.clearQueue();
    const after = useFeedSessionStore.getState();
    expect(after.queuedPostIds).toEqual([]);
    expect(after.newPostsCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd app && pnpm --filter @kc/mobile test -- feedSessionStore
```

Expected: FAIL — `enqueuePostId is not a function`.

- [ ] **Step 3: Implement**

In `app/apps/mobile/src/store/feedSessionStore.ts`, replace the `newPostsCount` / `incrementNewPosts` / `resetNewPosts` block with:

```typescript
interface FeedSessionState {
  /** Post IDs delivered via realtime since last refetch — drives the scroll-down pill and dedupes prepends. */
  queuedPostIds: string[];
  /** Derived for back-compat with NewPostsBanner. */
  readonly newPostsCount: number;
  /** Soft (session-only) dismissal of the first-post nudge. */
  firstPostNudgeDismissedThisSession: boolean;
  ephemeralToast: { message: string; tone: 'success' | 'error' } | null;

  enqueuePostId: (id: string) => void;
  clearQueue: () => void;
  dismissNudgeForSession: () => void;
  showEphemeralToast: (message: string, tone: 'success' | 'error', durationMs?: number) => void;
}

export const useFeedSessionStore = create<FeedSessionState>((set, get) => ({
  queuedPostIds: [],
  get newPostsCount() { return get().queuedPostIds.length; },
  firstPostNudgeDismissedThisSession: false,
  ephemeralToast: null,

  enqueuePostId: (id) => set((s) => (
    s.queuedPostIds.includes(id) ? s : { queuedPostIds: [...s.queuedPostIds, id] }
  )),
  clearQueue: () => set({ queuedPostIds: [] }),
  // …dismissNudgeForSession / showEphemeralToast unchanged…
}));
```

- [ ] **Step 4: Rename callers (compile-driven)**

Run `pnpm --filter @kc/mobile typecheck` and replace each `incrementNewPosts` / `resetNewPosts` call:

- `useFeedRealtime.ts` — deleted entirely in Task 9; OK to leave broken until then OR (recommended) gut it to a no-op now so this PR stays green.
- `app/(tabs)/index.tsx` — `resetNewPosts` → `clearQueue` (used inside `refetchAndReset`).

Expected: typecheck clean after rename.

- [ ] **Step 5: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/mobile test -- feedSessionStore
```

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/src/store/feedSessionStore.ts \
        app/apps/mobile/src/store/__tests__/feedSessionStore.test.ts \
        app/apps/mobile/app/\(tabs\)/index.tsx
git commit -m "refactor(mobile): feed session queue for scroll-down pill"
```

---

### Task 8: `RealtimeSyncCoordinator`

**Files:**
- Create: `app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts`
- Create: `app/apps/mobile/src/lib/realtime/__tests__/RealtimeSyncCoordinator.test.ts`
- Create: `app/apps/mobile/src/lib/realtime/useRealtimeSync.ts`
- Modify: `app/apps/mobile/src/services/postsComposition.ts` — add `getPostRealtime()` (and gate `getFeedRealtime()` deprecation against Task 9)
- Modify: `app/apps/mobile/src/services/userComposition.ts` — add `getUserRealtime()`
- Modify: `app/apps/mobile/src/components/AuthGate.tsx` — wire `useRealtimeSync(session)`

> **Verified ground truth (2026-05-24):** TanStack Query keys observed in the codebase — `['feed', viewerId, feedFilter]`, `['user-profile', userId]`, `['my-posts', userId]`, `['profile-closed-posts', userId]`, `['my-hidden-open-posts']`, `['openPostsCount']`, `['post', postId]`. Coordinator uses prefix-match `invalidateQueries` (`exact: false`) for `['my-posts']`, `['profile-closed-posts']`, `['my-hidden-open-posts']`, plus `setQueryData` on `['user-profile', userId]` for counter merges.

- [ ] **Step 1: Write failing test for coordinator behavior**

Create `app/apps/mobile/src/lib/realtime/__tests__/RealtimeSyncCoordinator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type {
  IPostRealtime,
  IUserRealtime,
  PostRealtimeCallbacks,
  UserRealtimeCallbacks,
  GetPostByIdUseCase,
  PostWithOwner,
} from '@kc/application';
import { RealtimeSyncCoordinator } from '../RealtimeSyncCoordinator';

function makePost(id: string): PostWithOwner {
  return {
    postId: id, ownerId: 'o', type: 'Give', status: 'Active', title: id, description: null,
    category: 'c', visibility: 'Public', city: 'TLV', street: 's', streetNumber: '1',
    locationDisplayLevel: 'city', itemCondition: null, urgency: null,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    owner: { userId: 'o', displayName: 'o', avatarUrl: null },
  } as PostWithOwner;
}

function makePortMocks() {
  const publicCbs: PostRealtimeCallbacks[] = [];
  const ownerCbs: PostRealtimeCallbacks[] = [];
  const userCbs: UserRealtimeCallbacks[] = [];
  const unsubs = { publicInsert: vi.fn(), ownerPosts: vi.fn(), user: vi.fn() };

  const postRt: IPostRealtime = {
    subscribeToPublicInserts: (cb) => { publicCbs.push(cb); return unsubs.publicInsert; },
    subscribeToOwnerPosts: (_uid, cb) => { ownerCbs.push(cb); return unsubs.ownerPosts; },
    subscribeToPost: () => () => {},
  };
  const userRt: IUserRealtime = {
    subscribeToUser: (_uid, cb) => { userCbs.push(cb); return unsubs.user; },
  };
  return { postRt, userRt, publicCbs, ownerCbs, userCbs, unsubs };
}

describe('RealtimeSyncCoordinator', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('start() subscribes user, owner-posts and public-insert ports', () => {
    const { postRt, userRt, publicCbs, ownerCbs, userCbs } = makePortMocks();
    const qc = new QueryClient();
    const getById = { execute: vi.fn() } as unknown as GetPostByIdUseCase;
    new RealtimeSyncCoordinator(qc, postRt, userRt, getById).start('viewer-1');
    expect(publicCbs).toHaveLength(1);
    expect(ownerCbs).toHaveLength(1);
    expect(userCbs).toHaveLength(1);
  });

  it('stop() unsubscribes everything and is idempotent', () => {
    const { postRt, userRt, unsubs } = makePortMocks();
    const c = new RealtimeSyncCoordinator(
      new QueryClient(), postRt, userRt, { execute: vi.fn() } as any,
    );
    c.start('v1'); c.stop(); c.stop();
    expect(unsubs.publicInsert).toHaveBeenCalledTimes(1);
    expect(unsubs.ownerPosts).toHaveBeenCalledTimes(1);
    expect(unsubs.user).toHaveBeenCalledTimes(1);
  });

  it('user UPDATE merges counters into [user-profile, viewerId]', () => {
    const { postRt, userRt, userCbs } = makePortMocks();
    const qc = new QueryClient();
    qc.setQueryData(['user-profile', 'v1'], {
      userId: 'v1', followersCount: 1, followingCount: 0, activePostsCountInternal: 0,
    });
    new RealtimeSyncCoordinator(qc, postRt, userRt, { execute: vi.fn() } as any).start('v1');
    userCbs[0]!.onUserUpdated({ userId: 'v1', followersCount: 9 });
    expect(qc.getQueryData(['user-profile', 'v1'])).toMatchObject({
      followersCount: 9, followingCount: 0,
    });
  });

  it('public INSERT: when at top + focused, hydrates exactly once per 250ms burst and prepends to feed cache', async () => {
    const { postRt, userRt, publicCbs } = makePortMocks();
    const qc = new QueryClient();
    qc.setQueryData(['feed', 'v1', {}], { posts: [], nextCursor: null });
    const getById = { execute: vi.fn(async ({ postId }: { postId: string }) => makePost(postId)) } as any;
    const c = new RealtimeSyncCoordinator(qc, postRt, userRt, getById);
    c.start('v1');
    c.setFeedContext({ isFocused: true, scrollOffsetY: 0, viewerId: 'v1', feedFilter: {} });

    publicCbs[0]!.onPostChange({ kind: 'insert', postId: 'NEW' });
    publicCbs[0]!.onPostChange({ kind: 'insert', postId: 'NEW' });
    publicCbs[0]!.onPostChange({ kind: 'insert', postId: 'OTHER' });
    vi.advanceTimersByTime(250);
    await vi.runAllTimersAsync();

    expect(getById.execute).toHaveBeenCalledTimes(1);
    const page = qc.getQueryData<any>(['feed', 'v1', {}]);
    expect(page.posts.map((p: any) => p.postId)).toEqual(['OTHER']);
  });

  it('public INSERT: when scrolled down, enqueues to feedSessionStore and does NOT hydrate', async () => {
    const { useFeedSessionStore } = await import('../../../store/feedSessionStore');
    useFeedSessionStore.getState().clearQueue();
    const { postRt, userRt, publicCbs } = makePortMocks();
    const qc = new QueryClient();
    const getById = { execute: vi.fn() } as any;
    const c = new RealtimeSyncCoordinator(qc, postRt, userRt, getById);
    c.start('v1');
    c.setFeedContext({ isFocused: true, scrollOffsetY: 200, viewerId: 'v1', feedFilter: {} });
    publicCbs[0]!.onPostChange({ kind: 'insert', postId: 'NEW' });
    vi.advanceTimersByTime(250);
    await vi.runAllTimersAsync();
    expect(getById.execute).not.toHaveBeenCalled();
    expect(useFeedSessionStore.getState().queuedPostIds).toEqual(['NEW']);
  });

  it('public INSERT: when feed tab not focused, drops the event entirely', async () => {
    const { useFeedSessionStore } = await import('../../../store/feedSessionStore');
    useFeedSessionStore.getState().clearQueue();
    const { postRt, userRt, publicCbs } = makePortMocks();
    const getById = { execute: vi.fn() } as any;
    const c = new RealtimeSyncCoordinator(new QueryClient(), postRt, userRt, getById);
    c.start('v1');
    c.setFeedContext({ isFocused: false, scrollOffsetY: 0, viewerId: 'v1', feedFilter: {} });
    publicCbs[0]!.onPostChange({ kind: 'insert', postId: 'NEW' });
    vi.advanceTimersByTime(250);
    await vi.runAllTimersAsync();
    expect(getById.execute).not.toHaveBeenCalled();
    expect(useFeedSessionStore.getState().queuedPostIds).toEqual([]);
  });

  it('owner UPDATE: debounces profile-list invalidations to ≤1 per 500ms window', async () => {
    const { postRt, userRt, ownerCbs } = makePortMocks();
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    new RealtimeSyncCoordinator(qc, postRt, userRt, { execute: vi.fn() } as any).start('v1');
    for (let i = 0; i < 4; i++) ownerCbs[0]!.onPostChange({ kind: 'update', postId: `p${i}` });
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();
    // One invalidation pass = 3 prefix-match calls (my-posts, profile-closed-posts, my-hidden-open-posts)
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it('owner DELETE: removes the post from any cached feed page synchronously', () => {
    const { postRt, userRt, ownerCbs } = makePortMocks();
    const qc = new QueryClient();
    qc.setQueryData(['feed', 'v1', {}], {
      posts: [makePost('A'), makePost('B')], nextCursor: null,
    });
    new RealtimeSyncCoordinator(qc, postRt, userRt, { execute: vi.fn() } as any).start('v1');
    ownerCbs[0]!.onPostChange({ kind: 'delete', postId: 'A' });
    expect(qc.getQueryData<any>(['feed', 'v1', {}]).posts.map((p: any) => p.postId)).toEqual(['B']);
  });

  it('flushQueuedFeedPosts: hydrates each queued id, prepends, and clears the queue', async () => {
    const { useFeedSessionStore } = await import('../../../store/feedSessionStore');
    useFeedSessionStore.getState().clearQueue();
    useFeedSessionStore.getState().enqueuePostId('q1');
    useFeedSessionStore.getState().enqueuePostId('q2');
    const { postRt, userRt } = makePortMocks();
    const qc = new QueryClient();
    qc.setQueryData(['feed', 'v1', {}], { posts: [], nextCursor: null });
    const getById = { execute: vi.fn(async ({ postId }: any) => makePost(postId)) } as any;
    const c = new RealtimeSyncCoordinator(qc, postRt, userRt, getById);
    c.start('v1');
    c.setFeedContext({ isFocused: true, scrollOffsetY: 0, viewerId: 'v1', feedFilter: {} });
    await c.flushQueuedFeedPosts();
    expect(getById.execute).toHaveBeenCalledTimes(2);
    expect(useFeedSessionStore.getState().queuedPostIds).toEqual([]);
    expect(qc.getQueryData<any>(['feed', 'v1', {}]).posts.map((p: any) => p.postId)).toEqual(['q2', 'q1']);
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd app && pnpm --filter @kc/mobile test -- RealtimeSyncCoordinator
```

Expected: FAIL — `Cannot find module '../RealtimeSyncCoordinator'`.

- [ ] **Step 3: Implement the coordinator**

Create `app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts`:

```typescript
// RealtimeSyncCoordinator — single-owner Realtime channel manager.
// Mapped to FR-FEED-009 (amendment §4) and FR-PROFILE-013 AC5.
//
// Channel budget (enforced by spec §7): ≤ 4 channels while authenticated:
//   1. users:single:<viewerId>      (counter freshness)
//   2. posts:owner:<viewerId>       (my profile grids, closed/hidden lists)
//   3. posts:public-insert          (feed prepend / pill queue)
//   4. posts:single:<id>            (post detail — opened in Phase 2 only)

import { AppState, type AppStateStatus } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import type {
  GetPostByIdUseCase,
  IPostRealtime,
  IUserRealtime,
  PostChangeEvent,
} from '@kc/application';
import { debounceAsync } from './debounceAsync';
import {
  prependPostToFeedCache,
  patchPostInFeedCache,
  removePostFromFeedCache,
  postMatchesClientFeedFilter,
  type ClientFeedFilter,
} from './feedCacheSync';
import { useFeedSessionStore } from '../../store/feedSessionStore';

const SCROLL_TOP_THRESHOLD_PX = 80;
const PUBLIC_INSERT_DEBOUNCE_MS = 250;
const OWNER_INVALIDATE_DEBOUNCE_MS = 500;
const BACKGROUND_DISCONNECT_MS = 60_000;

interface FeedContext {
  isFocused: boolean;
  scrollOffsetY: number;
  viewerId: string | null;
  feedFilter: ClientFeedFilter;
}

export class RealtimeSyncCoordinator {
  private viewerId: string | null = null;
  private unsubs: Array<() => void> = [];
  private feedCtx: FeedContext = {
    isFocused: false, scrollOffsetY: 0, viewerId: null, feedFilter: {},
  };
  private pendingInsertIds: string[] = [];
  private flushPublicInserts: (() => void) | null = null;
  private invalidateProfileLists: (() => void) | null = null;
  private appStateSub: { remove: () => void } | null = null;
  private backgroundTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectedForBackground = false;

  constructor(
    private readonly queryClient: QueryClient,
    private readonly postRt: IPostRealtime,
    private readonly userRt: IUserRealtime,
    private readonly getPostById: GetPostByIdUseCase,
  ) {}

  start(viewerId: string): void {
    if (this.viewerId === viewerId) return;
    if (this.viewerId) this.stop();
    this.viewerId = viewerId;

    this.flushPublicInserts = debounceAsync(
      () => this.processPublicInsertBurst(),
      PUBLIC_INSERT_DEBOUNCE_MS,
    );
    this.invalidateProfileLists = debounceAsync(
      async () => {
        await Promise.all([
          this.queryClient.invalidateQueries({ queryKey: ['my-posts'], exact: false }),
          this.queryClient.invalidateQueries({ queryKey: ['profile-closed-posts'], exact: false }),
          this.queryClient.invalidateQueries({ queryKey: ['my-hidden-open-posts'], exact: false }),
        ]);
      },
      OWNER_INVALIDATE_DEBOUNCE_MS,
    );

    this.unsubs.push(this.userRt.subscribeToUser(viewerId, {
      onUserUpdated: (payload) => this.mergeUserCounters(payload),
    }));
    this.unsubs.push(this.postRt.subscribeToOwnerPosts(viewerId, {
      onPostChange: (e) => this.handleOwnerPostChange(e),
    }));
    this.unsubs.push(this.postRt.subscribeToPublicInserts({
      onPostChange: (e) => this.handlePublicInsert(e),
    }));

    this.appStateSub = AppState.addEventListener('change', (s) => this.handleAppState(s));
  }

  stop(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    if (this.backgroundTimer) { clearTimeout(this.backgroundTimer); this.backgroundTimer = null; }
    this.appStateSub?.remove(); this.appStateSub = null;
    this.flushPublicInserts = null;
    this.invalidateProfileLists = null;
    this.pendingInsertIds = [];
    this.disconnectedForBackground = false;
    this.viewerId = null;
  }

  setFeedContext(ctx: FeedContext): void { this.feedCtx = ctx; }

  async flushQueuedFeedPosts(): Promise<void> {
    if (!this.viewerId) return;
    const ids = [...useFeedSessionStore.getState().queuedPostIds];
    useFeedSessionStore.getState().clearQueue();
    for (const id of ids) await this.hydrateAndPrepend(id);
  }

  private mergeUserCounters(payload: {
    userId: string; followersCount?: number; followingCount?: number;
    activePostsCountInternal?: number; activePostsCountPublic?: number;
  }): void {
    this.queryClient.setQueryData<Record<string, unknown> | undefined>(
      ['user-profile', payload.userId],
      (prev) => (prev ? { ...prev, ...stripUndefined(payload) } : prev),
    );
  }

  private handlePublicInsert(e: PostChangeEvent): void {
    if (e.kind !== 'insert') return;
    if (!this.feedCtx.isFocused) return;
    if (this.feedCtx.scrollOffsetY > SCROLL_TOP_THRESHOLD_PX) {
      useFeedSessionStore.getState().enqueuePostId(e.postId);
      return;
    }
    if (!this.pendingInsertIds.includes(e.postId)) this.pendingInsertIds.push(e.postId);
    this.flushPublicInserts?.();
  }

  private async processPublicInsertBurst(): Promise<void> {
    const ids = this.pendingInsertIds; this.pendingInsertIds = [];
    for (const id of ids) await this.hydrateAndPrepend(id);
  }

  private async hydrateAndPrepend(postId: string): Promise<void> {
    if (!this.viewerId) return;
    try {
      const post = await this.getPostById.execute({ postId, viewerId: this.viewerId });
      if (!post) return;
      if (!postMatchesClientFeedFilter(post, this.feedCtx.feedFilter)) return;
      prependPostToFeedCache(this.queryClient, this.viewerId, post);
    } catch {
      // Drop — feed will reconcile on next manual refresh / reconnect.
    }
  }

  private handleOwnerPostChange(e: PostChangeEvent): void {
    if (!this.viewerId) return;
    if (e.kind === 'delete') {
      removePostFromFeedCache(this.queryClient, this.viewerId, e.postId);
    } else if (e.kind === 'update') {
      void this.refetchAndPatch(e.postId);
    }
    this.invalidateProfileLists?.();
  }

  private async refetchAndPatch(postId: string): Promise<void> {
    if (!this.viewerId) return;
    try {
      const post = await this.getPostById.execute({ postId, viewerId: this.viewerId });
      if (post) patchPostInFeedCache(this.queryClient, this.viewerId, post);
    } catch { /* drop */ }
  }

  private handleAppState(state: AppStateStatus): void {
    if (state !== 'active') {
      if (this.backgroundTimer || !this.unsubs.length) return;
      this.backgroundTimer = setTimeout(() => {
        for (const u of this.unsubs) u();
        this.unsubs = [];
        this.disconnectedForBackground = true;
        this.backgroundTimer = null;
      }, BACKGROUND_DISCONNECT_MS);
      return;
    }
    if (this.backgroundTimer) { clearTimeout(this.backgroundTimer); this.backgroundTimer = null; }
    if (this.disconnectedForBackground && this.viewerId) {
      const vid = this.viewerId;
      this.viewerId = null;
      this.start(vid);
      this.disconnectedForBackground = false;
      void this.queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
    }
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  for (const k of Object.keys(obj) as Array<keyof T>) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}
```

- [ ] **Step 4: Composition root — `getPostRealtime()` / `getUserRealtime()`**

In `app/apps/mobile/src/services/postsComposition.ts`, alongside `getFeedRealtime()`:

```typescript
import { SupabasePostRealtime } from '@kc/infrastructure-supabase';
import type { IPostRealtime } from '@kc/application';

let _postRealtime: IPostRealtime | null = null;
export function getPostRealtime(): IPostRealtime {
  if (!_postRealtime) _postRealtime = new SupabasePostRealtime(getSupabaseClient(makeStorage()));
  return _postRealtime;
}
```

In `app/apps/mobile/src/services/userComposition.ts`:

```typescript
import { SupabaseUserRealtime } from '@kc/infrastructure-supabase';
import type { IUserRealtime } from '@kc/application';

let _userRealtime: IUserRealtime | null = null;
export function getUserRealtime(): IUserRealtime {
  if (!_userRealtime) _userRealtime = new SupabaseUserRealtime(getSupabaseClient(makeStorage()));
  return _userRealtime;
}
```

(Verify the actual `getSupabaseClient` factory signature in the surrounding file — match the pattern used by the existing realtime singleton.)

- [ ] **Step 5: `useRealtimeSync` hook + AuthGate wire**

Create `app/apps/mobile/src/lib/realtime/useRealtimeSync.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeSyncCoordinator } from './RealtimeSyncCoordinator';
import { getPostRealtime, getPostByIdUseCase } from '../../services/postsComposition';
import { getUserRealtime } from '../../services/userComposition';

let singleton: RealtimeSyncCoordinator | null = null;
export function getRealtimeCoordinator(qc?: ReturnType<typeof useQueryClient>): RealtimeSyncCoordinator {
  if (!singleton) {
    if (!qc) throw new Error('Coordinator not initialized — call useRealtimeSync first');
    singleton = new RealtimeSyncCoordinator(qc, getPostRealtime(), getUserRealtime(), getPostByIdUseCase());
  }
  return singleton;
}

export function useRealtimeSync(viewerId: string | null): void {
  const qc = useQueryClient();
  const started = useRef<string | null>(null);
  useEffect(() => {
    const c = getRealtimeCoordinator(qc);
    if (viewerId && started.current !== viewerId) { c.start(viewerId); started.current = viewerId; }
    if (!viewerId && started.current) { c.stop(); started.current = null; }
    return () => { /* AuthGate unmount only happens on full app teardown */ };
  }, [qc, viewerId]);
}
```

In `app/apps/mobile/src/components/AuthGate.tsx`, alongside the existing `session` consumer, add a single line:

```typescript
useRealtimeSync(session?.userId ?? null);
```

(Skip ghost sessions: if your auth store flags ghosts, pass `session?.isGhost ? null : session?.userId ?? null`.)

- [ ] **Step 6: Run tests — confirm green**

```bash
cd app && pnpm --filter @kc/mobile test -- RealtimeSyncCoordinator
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/apps/mobile/src/lib/realtime/RealtimeSyncCoordinator.ts \
        app/apps/mobile/src/lib/realtime/__tests__/RealtimeSyncCoordinator.test.ts \
        app/apps/mobile/src/lib/realtime/useRealtimeSync.ts \
        app/apps/mobile/src/services/postsComposition.ts \
        app/apps/mobile/src/services/userComposition.ts \
        app/apps/mobile/src/components/AuthGate.tsx
git commit -m "feat(mobile): RealtimeSyncCoordinator for feed and profile"
```

---

### Task 9: Wire Home Feed screen

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`
- Delete: `app/apps/mobile/src/hooks/useFeedRealtime.ts` (no other callers — `grep -r useFeedRealtime app/` to confirm before deleting)
- Modify: `app/packages/infrastructure-supabase/src/index.ts` — remove `SupabaseFeedRealtime` export (file kept on disk for the next sweep; reduces public surface now)
- Modify: `app/apps/mobile/src/services/postsComposition.ts` — remove the unused `getFeedRealtime()` getter

- [ ] **Step 1: Replace `useFeedRealtime` with coordinator context updates in `app/(tabs)/index.tsx`**

Replace the existing `useFeedRealtime(refetchAndReset)` line and `refetchAndReset` callback. The full patch in context:

```typescript
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRealtimeSync, getRealtimeCoordinator } from '../../src/lib/realtime/useRealtimeSync';

// inside the component, replace the refetchAndReset / useFeedRealtime block:
const isFocused = useIsFocused();
const scrollOffsetRef = useRef(0);

useRealtimeSync(viewerId);

useFocusEffect(
  useCallback(() => {
    getRealtimeCoordinator().setFeedContext({
      isFocused: true, scrollOffsetY: scrollOffsetRef.current, viewerId, feedFilter,
    });
    return () => {
      getRealtimeCoordinator().setFeedContext({
        isFocused: false, scrollOffsetY: scrollOffsetRef.current, viewerId, feedFilter,
      });
    };
  }, [viewerId, feedFilter]),
);

const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
  scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  getRealtimeCoordinator().setFeedContext({
    isFocused, scrollOffsetY: scrollOffsetRef.current, viewerId, feedFilter,
  });
}, [isFocused, viewerId, feedFilter]);

const refetchAndReset = useCallback(async () => {
  await getRealtimeCoordinator().flushQueuedFeedPosts();
  listRef.current?.scrollToOffset({ offset: 0, animated: true });
}, []);
```

- [ ] **Step 2: Pass `onScroll` to `PostFeedList`**

Inspect `PostFeedList.tsx` props. If `onScroll` is not already forwarded to the underlying `FlatList`, add it (single line in the props spread). Show the change in the commit.

- [ ] **Step 3: `NewPostsBanner` — confirm `onPress` calls `refetchAndReset`**

The existing `NewPostsBanner` already receives an `onPress` handler from the feed screen. With Task 7's queue + new `refetchAndReset` (which calls `flushQueuedFeedPosts()`), no banner change is needed — verify behavior with the manual QA below.

- [ ] **Step 4: Delete `useFeedRealtime` and dead exports**

```bash
grep -rn "useFeedRealtime\|getFeedRealtime\|SupabaseFeedRealtime" app/ --include="*.ts" --include="*.tsx"
```

Expected: only the files we are about to modify. Then:

```bash
git rm app/apps/mobile/src/hooks/useFeedRealtime.ts
```

Remove `getFeedRealtime()` from `postsComposition.ts` and `SupabaseFeedRealtime` export from `packages/infrastructure-supabase/src/index.ts`. (Leave `SupabaseFeedRealtime.ts` and its test on disk — purge in a follow-up `chore` PR after `dev` is stable for ≥1 day.)

- [ ] **Step 5: Verification gate**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green.

- [ ] **Step 6: Manual QA on dev**
  - Device A at top of feed (offset 0); Device B publishes a public post → A sees the post prepended within 2s without pull-to-refresh.
  - Device A scrolled past 80px → Device B publishes → pill increments → tap pill → posts appear, list scrolls to top, pill clears.
  - Background app on Device A for >60s → foreground → exactly one `['feed']` refetch fires (check React-Query devtools or Metro `__DEV__` log); channel count returns to 3 (no leaks).
  - Sign out on Device A → confirm no Realtime channels remain (`coordinator.stop()` ran).

- [ ] **Step 7: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/index.tsx \
        app/apps/mobile/src/services/postsComposition.ts \
        app/packages/infrastructure-supabase/src/index.ts \
        app/apps/mobile/src/components/PostFeedList.tsx
git rm  app/apps/mobile/src/hooks/useFeedRealtime.ts
git commit -m "feat(mobile): IG-style feed merge via RealtimeSyncCoordinator"
```

---

### Task 10: Profile counters (my profile) — verification only

> **No code changes expected.** The coordinator's `mergeUserCounters` (Task 8) writes directly to `['user-profile', userId]`. `MyProfileChrome.tsx:59` already reads from that key. This task is a verification gate — skip the commit if Steps 1–2 pass.

- [ ] **Step 1: Confirm cache wiring**

```bash
grep -n "queryKey: \['user-profile'" app/apps/mobile/src/components/profile/MyProfileChrome.tsx
```

Expected: line `59:    queryKey: ['user-profile', userId],` (or equivalent). If the key differs, update `mergeUserCounters` in Task 8 to match.

- [ ] **Step 2: Manual QA on dev**

From a second logged-in device or web tab, close one of my open posts. On my profile within ≤2s:
- Open posts grid removes the closed post (driven by debounced `invalidateProfileLists`).
- `activePostsCountInternal` counter on the header decrements (driven by `users` row UPDATE + `mergeUserCounters`).

- [ ] **Step 3: No commit** (verification only). If a wiring mismatch surfaced in Step 1, fold the fix into the Task 8 commit instead.

---

### Task 11: List performance guard (TD-126 slice)

**Files:**
- Modify: `app/apps/mobile/src/components/PostCard.tsx` — wrap export in `React.memo` with explicit compare
- Modify: `app/apps/mobile/src/components/PostFeedList.tsx` — stable `keyExtractor` + `renderItem` via `useCallback`

- [ ] **Step 1: Memoize `PostCard`**

At the bottom of `PostCard.tsx`, replace the default `export default PostCard` with:

```typescript
function arePostCardPropsEqual(prev: PostCardProps, next: PostCardProps): boolean {
  return (
    prev.post.postId === next.post.postId &&
    prev.post.updatedAt === next.post.updatedAt &&
    prev.post.status === next.post.status &&
    prev.post.title === next.post.title &&
    prev.post.visibility === next.post.visibility &&
    prev.onPress === next.onPress
  );
}

export default React.memo(PostCard, arePostCardPropsEqual);
```

(If the file already has a named `export const PostCard`, wrap that export; keep the same identifier so call sites compile unchanged.)

- [ ] **Step 2: Stabilize `renderItem` + `keyExtractor` in `PostFeedList.tsx`**

```typescript
const keyExtractor = useCallback((p: PostWithOwner) => p.postId, []);
const renderItem = useCallback(
  ({ item }: { item: PostWithOwner }) => <PostCard post={item} onPress={onItemPress} />,
  [onItemPress],
);
// ...
<FlatList … keyExtractor={keyExtractor} renderItem={renderItem} onScroll={onScroll} />
```

- [ ] **Step 3: Smoke test on dev**

Scroll a feed of ≥20 posts to mid-list. From a second device publish a public post.

Expected: list does not flicker; only the prepended row appears with no visible reflow of existing rows.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/PostCard.tsx \
        app/apps/mobile/src/components/PostFeedList.tsx
git commit -m "perf(mobile): memo PostCard for realtime prepend"
```

---

### Task 12: Phase 1 verification gate

- [ ] **Run from `app/`:**

```bash
pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Update SSOT** — FR-FEED-009 status note; close TD-105 counter slice in `TECH_DEBT.md`; mark BACKLOG item done.

- [ ] **PR** — single PR `feat/FR-FEED-009-realtime-coordinator-phase1` to `dev`.

---

## Out of scope for this plan — follow-up plans required

Per the writing-plans skill ("one plan per subsystem"), Phase 2 and Phase 3 ship as separate plans **after Phase 1 lands and stays stable on `dev` for ≥1 week**. Their scopes are recorded here so the next planner can pick them up without re-reading the design spec.

### Future plan: `<YYYY-MM-DD>-app-realtime-sync-phase-2.md` — Other profile + Post detail

**Mapped to spec:** design §5.2 + §6.

**Tasks to write:**
- `useOtherProfileRealtime(handle)` — on focus, resolve `userId` and call new `coordinator.watchOtherUser(userId)` (extends `RealtimeSyncCoordinator` API); unwatch on blur. Channel cap stays ≤ 4 — the optional 4th slot is reused between post-detail and other-profile (not both at once).
- Debounced 500ms invalidate of `['profile-other', handle]`, `['profile-other-posts', userId]`, `['profile-other-post-count', userId]`.
- `app/post/[id].tsx` — `subscribeToPost(postId)` on mount via coordinator; on UPDATE/DELETE invalidate `['post', postId]` and patch the cached feed page via `patchPostInFeedCache` / `removePostFromFeedCache`. Always unsubscribe on unmount.
- Manual QA: prepended post tappable mid-prepend; closure on other device reflects in detail screen without pull.

### Future plan: `<YYYY-MM-DD>-app-realtime-sync-phase-3.md` — Follow requests, notifications, stats

**Mapped to spec:** design §8 phase 3; closes TD-98 (stats) slice.

**Tasks to write:**
- Migration: add `follow_requests`, `notifications` (or current names per `database.types.ts` at the time) to `supabase_realtime` publication — same `do $$ … add table … $$` pattern as Task 1 here.
- Extend coordinator: on `follow_requests` INSERT/UPDATE for the viewer → invalidate `['pending-requests']`. On `notifications` INSERT → invalidate `['notifications']`.
- Stats: extend `mergeUserCounters` to also invalidate `['my-activity-timeline']` (a cheap re-fetch is acceptable here since the screen is rarely on screen).

**Gate to start Phase 3:** ≥7 days on `dev` without Realtime-related Sentry noise + PM sign-off.

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
