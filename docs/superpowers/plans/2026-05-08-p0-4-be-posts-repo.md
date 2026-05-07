# P0.4-BE — Posts Repository Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `SupabasePostRepository` against the `IPostRepository` port so the FE feed/create/post-detail surfaces can stop reading `MOCK_POSTS`. Closes TD-13 for the create/read/delete + feed surface. Closure (`close`, `reopen`) is intentionally deferred to the P0.6 slice and is left as `not_implemented` stubs.

**Architecture:** PostgREST via `@supabase/supabase-js`. RLS already enforces visibility (Public / FollowersOnly / OnlyMe / closed_delivered) and active-cap / visibility-upgrade-only triggers, so the adapter stays thin: shape filters, page with a cursor on `created_at`, fetch `owner` + `media_assets` via nested select, map snake_case rows → domain camelCase. Pure mappers (`mapPostRow`, `mapPostWithOwnerRow`, cursor encode/decode) live in their own files for clarity.

**Tech Stack:** TypeScript 5.5, `@supabase/supabase-js@^2.69`, generated `Database` types from `database.types.ts`. No new runtime deps. No new migrations (0002 already provides everything we need).

**Lane:** Backend (BE). Files touched live in `packages/application/src/ports/**` (shared contract — port signatures, BE-led per parallel-agents §6.2) and `packages/infrastructure-supabase/**` (BE-exclusive). One contract commit at the head of the PR per parallel-agents §6.4.

**SRS coverage in this slice:**
- FR-POST-001 / 002 / 003 / 004 / 008 / 010 / 011 (server side — RLS + triggers; adapter just calls)
- FR-POST-009 (visibility upgrade — DB trigger throws; adapter surfaces error)
- FR-POST-014 / 015 (single-post read via `findById`)
- FR-FEED-001 / 002 (chronological public feed; cursor-paginated)
- FR-FEED-003 / 004 / 005 (filters: type, category, city; sort: newest / city)
- FR-FEED-013 (countOpenByUser → "first post nudge" data)

**Out of scope (later slices):**
- FR-POST-005 image upload from device (FE owns expo-image-picker → uploads bytes → sends paths to `create()`).
- FR-POST-007 local-draft autosave (FE).
- FR-POST-013 expiry job (`bg-job-post-expiry`, post-MVP background job).
- FR-POST-020 forbidden-keyword advisory (post-MVP).
- FR-CLOSURE-* — `close`/`reopen` stubs throw `not_implemented('P0.6')`.
- Realtime feed subscription (FR-FEED-014 / 015 — P1.2).
- Updating `mediaAssets` via `update()` (image swap on edit) — defer to a focused slice.

---

## File Structure

| Path | Purpose | Status |
| ---- | ------- | ------ |
| `app/packages/application/src/ports/IPostRepository.ts` | Port. Add input types; tighten `create`/`update` signatures. | **Modify** |
| `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` | The adapter. ~180 LOC. | **Create** |
| `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts` | Pure DB-row → domain mappers. ~80 LOC. | **Create** |
| `app/packages/infrastructure-supabase/src/posts/cursor.ts` | Pure cursor encode/decode. ~25 LOC. | **Create** |
| `app/packages/infrastructure-supabase/src/index.ts` | Re-export the new class. | **Modify** |
| `docs/SSOT/PROJECT_STATUS.md` | Sprint board claim, completion log, TD-13 status. | **Modify** |

No migration files. The 0002 migration already provides `posts`, `media_assets`, `recipients`, `is_post_visible_to`, all triggers, and the `post-images` Storage bucket.

---

## Pre-flight (one time, do not commit)

- [ ] **Step 0.1: Verify clean tree on a fresh branch off main**

```bash
git fetch origin
git switch main
git pull --ff-only origin main
gh pr list --state open --json number,title,headRefName,isDraft
```

Expected: empty PR list (no concurrent BE slice in flight). If a BE slice is already open, stop and re-pick.

- [ ] **Step 0.2: Create the feature branch**

```bash
git switch -c feat/FR-POST-001-be-posts-repo
```

Branch name follows parallel-agents §8.1 (`<type>/<FR-id>-<lane>-<slug>`).

- [ ] **Step 0.3: Confirm baseline typecheck is green**

```bash
pnpm --filter @kc/application typecheck
pnpm --filter @kc/infrastructure-supabase typecheck
pnpm --filter @kc/application test
```

Expected: all three commands exit 0. If not, stop and fix the baseline before adding new code.

---

## Task 1: Contract — tighten `IPostRepository` signatures

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts`

**Why this is its own commit:** parallel-agents §6.4 requires every change under `packages/{domain,application}/**` to ship as a `(contract)`-scoped commit at the head of the slice's PR, with the file list in the PR body. Keeping it isolated lets the FE agent rebase cleanly when their `CreatePostUseCase` lands.

**Why it's needed:** the existing `create(post: Omit<Post, 'postId' | 'createdAt' | 'updatedAt' | 'reopenCount' | 'deleteAfter' | 'recipient'>)` is wrong — `Post.mediaAssets: MediaAsset[]` forces the caller to fabricate `mediaAssetId`, `postId` (cyclical, the post doesn't exist yet), and `createdAt`. The new `CreatePostInput` removes the cycle. `update`'s `Partial<Post>` is too loose — it allows mutating `postId`/`ownerId`. `UpdatePostInput` lists only fields FR-POST-008 AC1 declares editable.

- [ ] **Step 1.1: Replace the file**

```typescript
// app/packages/application/src/ports/IPostRepository.ts
import type { Post, Recipient } from '@kc/domain';
import type {
  Address,
  Category,
  ItemCondition,
  LocationDisplayLevel,
  PostStatus,
  PostType,
  PostVisibility,
} from '@kc/domain';

export interface PostFeedFilter {
  type?: PostType;
  category?: Category;
  city?: string;
  includeClosed?: boolean;
  searchQuery?: string;
  sortBy?: 'newest' | 'city';
}

export interface FeedPage {
  posts: PostWithOwner[];
  nextCursor: string | null;
}

export interface PostWithOwner extends Post {
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownerHandle: string;
  ownerPrivacyMode: 'Public' | 'Private';
}

export interface MediaAssetInput {
  path: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreatePostInput {
  ownerId: string;
  type: PostType;
  visibility: PostVisibility;
  title: string;
  description: string | null;
  category: Category;
  address: Address;
  locationDisplayLevel: LocationDisplayLevel;
  itemCondition: ItemCondition | null;
  urgency: string | null;
  mediaAssets: MediaAssetInput[];
}

export interface UpdatePostInput {
  title?: string;
  description?: string | null;
  category?: Category;
  address?: Address;
  locationDisplayLevel?: LocationDisplayLevel;
  itemCondition?: ItemCondition | null;
  urgency?: string | null;
  visibility?: PostVisibility;
}

export interface IPostRepository {
  // Feed
  getFeed(
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage>;

  // Single post
  findById(postId: string, viewerId: string | null): Promise<PostWithOwner | null>;

  // Mutations
  create(input: CreatePostInput): Promise<Post>;
  update(postId: string, patch: UpdatePostInput): Promise<Post>;
  delete(postId: string): Promise<void>;

  // Closure (filled in P0.6 — closure flow slice)
  close(postId: string, recipientUserId: string | null): Promise<Post>;
  reopen(postId: string): Promise<Post>;

  // User's own posts
  getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]>;

  // Stats
  countOpenByUser(userId: string): Promise<number>;
}
```

- [ ] **Step 1.2: Typecheck both packages that import the port**

```bash
pnpm --filter @kc/application typecheck
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: both pass. The only existing consumers (`selectGuestPreviewPosts.ts` and the mock data) reference `PostWithOwner` and `FeedPage` — neither shape changed, so nothing should break.

- [ ] **Step 1.3: Run the application test suite**

```bash
pnpm --filter @kc/application test
```

Expected: all tests pass (no test references `create()` or `update()` directly).

- [ ] **Step 1.4: Commit**

```bash
git add app/packages/application/src/ports/IPostRepository.ts
git commit -m "feat(contract): tighten IPostRepository create/update signatures (P0.4-BE)"
```

---

## Task 2: Pure helpers — cursor codec

**Files:**
- Create: `app/packages/infrastructure-supabase/src/posts/cursor.ts`

**Why a separate file:** keeps the adapter readable and the codec independently inspectable. Cursor format: an opaque base64-url string wrapping `{createdAt: ISO8601}`. We sort by `created_at DESC`, so the next page's filter is `created_at < cursor.createdAt`. Sub-millisecond ties are not handled — the timestamp column is `timestamptz` (microsecond precision) and the chance of a collision is vanishingly small for a community-scale feed.

- [ ] **Step 2.1: Create the codec**

```typescript
// app/packages/infrastructure-supabase/src/posts/cursor.ts

export interface FeedCursor {
  createdAt: string; // ISO8601
}

export function encodeCursor(cursor: FeedCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string | undefined): FeedCursor | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as Partial<FeedCursor>;
    if (!parsed.createdAt || typeof parsed.createdAt !== 'string') return null;
    if (Number.isNaN(Date.parse(parsed.createdAt))) return null;
    return { createdAt: parsed.createdAt };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2.2: Typecheck**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: pass. (`Buffer` resolves via `@types/node` already in devDependencies.)

---

## Task 3: Pure helpers — row mappers

**Files:**
- Create: `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts`

**Why a separate file:** mapping is the most regression-prone part of any adapter. Isolating it makes the SQL-shape changes from future migrations easy to absorb in one place.

The `posts` row carries an inlined Address (city, street, street_number, location_display_level). The domain `Post.address` is a value object with `{city, cityName, street, streetNumber}`. We require the join with `cities.name_he` to produce `cityName`. `media_assets` rows map 1:1 onto the domain `MediaAsset[]`, sorted by `ordinal`.

- [ ] **Step 3.1: Create the mappers**

```typescript
// app/packages/infrastructure-supabase/src/posts/mapPostRow.ts
import type {
  Address,
  Category,
  ItemCondition,
  LocationDisplayLevel,
  MediaAsset,
  Post,
  PostStatus,
  PostType,
  PostVisibility,
} from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import type { Database } from '../database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type MediaAssetRow = Database['public']['Tables']['media_assets']['Row'];
type RecipientRow = Database['public']['Tables']['recipients']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

export interface PostJoinedRow extends PostRow {
  city_ref?: { name_he: string } | null;
  media_assets?: MediaAssetRow[] | null;
  recipient?: RecipientRow | null;
}

export interface PostWithOwnerJoinedRow extends PostJoinedRow {
  owner: Pick<UserRow, 'user_id' | 'display_name' | 'avatar_url' | 'share_handle' | 'privacy_mode'> | null;
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    mediaAssetId: row.media_asset_id,
    postId: row.post_id,
    path: row.path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function mapAddress(row: PostJoinedRow): Address {
  return {
    city: row.city,
    cityName: row.city_ref?.name_he ?? row.city,
    street: row.street,
    streetNumber: row.street_number,
  };
}

export function mapPostRow(row: PostJoinedRow): Post {
  const media = (row.media_assets ?? []).slice().sort((a, b) => a.ordinal - b.ordinal);
  return {
    postId: row.post_id,
    ownerId: row.owner_id,
    type: row.type as PostType,
    status: row.status as PostStatus,
    visibility: row.visibility as PostVisibility,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    address: mapAddress(row),
    locationDisplayLevel: row.location_display_level as LocationDisplayLevel,
    itemCondition: (row.item_condition as ItemCondition | null) ?? null,
    urgency: row.urgency,
    mediaAssets: media.map(mapMediaAsset),
    recipient: row.recipient
      ? {
          postId: row.recipient.post_id,
          recipientUserId: row.recipient.recipient_user_id,
          markedAt: row.recipient.marked_at,
        }
      : null,
    reopenCount: row.reopen_count,
    deleteAfter: row.delete_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPostWithOwnerRow(row: PostWithOwnerJoinedRow): PostWithOwner {
  if (!row.owner) {
    throw new Error(`mapPostWithOwnerRow: post ${row.post_id} has no owner row`);
  }
  return {
    ...mapPostRow(row),
    ownerName: row.owner.display_name,
    ownerAvatarUrl: row.owner.avatar_url,
    ownerHandle: row.owner.share_handle,
    ownerPrivacyMode: row.owner.privacy_mode as 'Public' | 'Private',
  };
}

export const POST_SELECT_OWNER = `
  *,
  city_ref:cities!posts_city_fkey(name_he),
  media_assets(*),
  recipient:recipients(*),
  owner:users!posts_owner_id_fkey(user_id, display_name, avatar_url, share_handle, privacy_mode)
`;

export const POST_SELECT_BARE = `
  *,
  city_ref:cities!posts_city_fkey(name_he),
  media_assets(*),
  recipient:recipients(*)
`;
```

- [ ] **Step 3.2: Typecheck**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: pass.

---

## Task 4: The adapter — `SupabasePostRepository`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts`

**Design notes:**
- All queries flow through PostgREST. RLS enforces visibility (`is_post_visible_to`) so we do **not** filter by visibility in the adapter — the rows simply do not come back to non-eligible viewers.
- The `viewerId` parameter is informational only (the adapter relies on `auth.uid()` from the JWT carried by the SupabaseClient instance). Anonymous calls pass `viewerId = null` and rely on the anon JWT — RLS still filters to Public+open.
- `create()` is two PostgREST calls (insert post, then insert media_assets) wrapped in best-effort cleanup: if the media insert fails, we delete the orphan post. A single-RPC transaction would be tighter but is not required for MVP scale; logged below as TD-50.
- `close()` and `reopen()` throw `not_implemented('P0.6')` — they require atomic two-row mutations (post + recipients) and are owned by the closure-flow slice, which will provide a Postgres function and rewire the adapter.
- DB trigger errors (`active_post_limit_exceeded`, `visibility_downgrade_forbidden`, `media_asset_limit_exceeded`) surface as plain `Error` with the trigger's message in the body. The use-case layer (P0.4-FE) is responsible for mapping these to friendly Hebrew copy in toast/modal form.

- [ ] **Step 4.1: Create the adapter**

```typescript
// app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts
// SupabasePostRepository — adapter for IPostRepository.
// Mapped to SRS: FR-POST-001..004, FR-POST-008..011, FR-POST-014, FR-FEED-001..005, FR-FEED-013.
// Closure stubs (close/reopen) ship in P0.6. See PROJECT_STATUS §6 TD-13.
// docs/SSOT/SRS/02_functional_requirements/04_posts.md

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreatePostInput,
  FeedPage,
  IPostRepository,
  PostFeedFilter,
  PostWithOwner,
  UpdatePostInput,
} from '@kc/application';
import type { Post, PostStatus } from '@kc/domain';
import type { Database } from '../database.types';
import {
  POST_SELECT_BARE,
  POST_SELECT_OWNER,
  mapPostRow,
  mapPostWithOwnerRow,
  type PostJoinedRow,
  type PostWithOwnerJoinedRow,
} from './mapPostRow';
import { decodeCursor, encodeCursor } from './cursor';

const NOT_IMPL = (name: string, slice: string) =>
  new Error(`SupabasePostRepository.${name}: not_implemented (${slice})`);

const FEED_HARD_MAX = 100;

export class SupabasePostRepository implements IPostRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── Feed ────────────────────────────────────────────────────────────────
  async getFeed(
    _viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage> {
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));
    const decoded = decodeCursor(cursor);

    let q = this.client
      .from('posts')
      .select(POST_SELECT_OWNER);

    // Status filter — RLS already hides removed_admin / expired / deleted_no_recipient
    // from non-owners. We default to open-only; closed_delivered is opt-in for
    // FR-POST-017 (recipient view) and FR-POST-016 (owner closed view).
    q = filter.includeClosed
      ? q.in('status', ['open', 'closed_delivered'])
      : q.eq('status', 'open');

    if (filter.type) q = q.eq('type', filter.type);
    if (filter.category) q = q.eq('category', filter.category);
    if (filter.city) q = q.eq('city', filter.city);

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const escaped = filter.searchQuery.trim().replace(/[%_]/g, '\\$&');
      q = q.ilike('title', `%${escaped}%`);
    }

    if (decoded) q = q.lt('created_at', decoded.createdAt);

    if (filter.sortBy === 'city') {
      q = q.order('city', { ascending: true }).order('created_at', { ascending: false });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    q = q.limit(safeLimit + 1);

    const { data, error } = await q;
    if (error) throw new Error(`getFeed: ${error.message}`);

    const rows = (data ?? []) as unknown as PostWithOwnerJoinedRow[];
    const hasMore = rows.length > safeLimit;
    const page = hasMore ? rows.slice(0, safeLimit) : rows;
    const posts = page.map(mapPostWithOwnerRow);
    const nextCursor =
      hasMore && page.length > 0
        ? encodeCursor({ createdAt: page[page.length - 1].createdAt })
        : null;
    return { posts, nextCursor };
  }

  // ── Single post ─────────────────────────────────────────────────────────
  async findById(postId: string, _viewerId: string | null): Promise<PostWithOwner | null> {
    const { data, error } = await this.client
      .from('posts')
      .select(POST_SELECT_OWNER)
      .eq('post_id', postId)
      .maybeSingle();
    if (error) throw new Error(`findById: ${error.message}`);
    if (!data) return null;
    return mapPostWithOwnerRow(data as unknown as PostWithOwnerJoinedRow);
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  async create(input: CreatePostInput): Promise<Post> {
    const { data: insertedPost, error: insertErr } = await this.client
      .from('posts')
      .insert({
        owner_id: input.ownerId,
        type: input.type,
        visibility: input.visibility,
        title: input.title,
        description: input.description,
        category: input.category,
        city: input.address.city,
        street: input.address.street,
        street_number: input.address.streetNumber,
        location_display_level: input.locationDisplayLevel,
        item_condition: input.itemCondition,
        urgency: input.urgency,
      })
      .select('post_id')
      .single();
    if (insertErr) throw new Error(`create.post: ${insertErr.message}`);
    if (!insertedPost) throw new Error('create.post: no row returned');

    const postId = insertedPost.post_id;

    if (input.mediaAssets.length > 0) {
      const mediaRows = input.mediaAssets.map((m, i) => ({
        post_id: postId,
        ordinal: i,
        path: m.path,
        mime_type: m.mimeType,
        size_bytes: m.sizeBytes,
      }));
      const { error: mediaErr } = await this.client.from('media_assets').insert(mediaRows);
      if (mediaErr) {
        // Best-effort orphan cleanup. If this fails too, the post row remains
        // and the user sees their post without images; recovery is by edit/delete.
        await this.client.from('posts').delete().eq('post_id', postId);
        throw new Error(`create.media: ${mediaErr.message}`);
      }
    }

    const created = await this.fetchPostById(postId);
    if (!created) throw new Error(`create: post ${postId} disappeared after insert`);
    return created;
  }

  async update(postId: string, patch: UpdatePostInput): Promise<Post> {
    const updateRow: Database['public']['Tables']['posts']['Update'] = {};
    if (patch.title !== undefined) updateRow.title = patch.title;
    if (patch.description !== undefined) updateRow.description = patch.description;
    if (patch.category !== undefined) updateRow.category = patch.category;
    if (patch.locationDisplayLevel !== undefined)
      updateRow.location_display_level = patch.locationDisplayLevel;
    if (patch.itemCondition !== undefined) updateRow.item_condition = patch.itemCondition;
    if (patch.urgency !== undefined) updateRow.urgency = patch.urgency;
    if (patch.visibility !== undefined) updateRow.visibility = patch.visibility;
    if (patch.address) {
      updateRow.city = patch.address.city;
      updateRow.street = patch.address.street;
      updateRow.street_number = patch.address.streetNumber;
    }

    if (Object.keys(updateRow).length === 0) {
      const current = await this.fetchPostById(postId);
      if (!current) throw new Error(`update: post ${postId} not found`);
      return current;
    }

    const { error } = await this.client.from('posts').update(updateRow).eq('post_id', postId);
    if (error) throw new Error(`update: ${error.message}`);

    const updated = await this.fetchPostById(postId);
    if (!updated) throw new Error(`update: post ${postId} not found after update`);
    return updated;
  }

  async delete(postId: string): Promise<void> {
    const { error } = await this.client.from('posts').delete().eq('post_id', postId);
    if (error) throw new Error(`delete: ${error.message}`);
  }

  // ── Closure (P0.6) ──────────────────────────────────────────────────────
  async close(_postId: string, _recipientUserId: string | null): Promise<Post> {
    throw NOT_IMPL('close', 'P0.6');
  }
  async reopen(_postId: string): Promise<Post> {
    throw NOT_IMPL('reopen', 'P0.6');
  }

  // ── User's own posts ────────────────────────────────────────────────────
  async getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]> {
    if (status.length === 0) return [];
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));
    const decoded = decodeCursor(cursor);

    let q = this.client
      .from('posts')
      .select(POST_SELECT_BARE)
      .eq('owner_id', userId)
      .in('status', status)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (decoded) q = q.lt('created_at', decoded.createdAt);

    const { data, error } = await q;
    if (error) throw new Error(`getMyPosts: ${error.message}`);
    const rows = (data ?? []) as unknown as PostJoinedRow[];
    return rows.map(mapPostRow);
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  async countOpenByUser(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('posts')
      .select('post_id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', 'open');
    if (error) throw new Error(`countOpenByUser: ${error.message}`);
    return count ?? 0;
  }

  // ── Internal ────────────────────────────────────────────────────────────
  private async fetchPostById(postId: string): Promise<Post | null> {
    const { data, error } = await this.client
      .from('posts')
      .select(POST_SELECT_BARE)
      .eq('post_id', postId)
      .maybeSingle();
    if (error) throw new Error(`fetchPostById: ${error.message}`);
    if (!data) return null;
    return mapPostRow(data as unknown as PostJoinedRow);
  }
}
```

- [ ] **Step 4.2: Typecheck**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: pass. If `Database` types complain about the nested-select alias names (`city_ref`, `owner`, `recipient`), the casts via `as unknown as PostJoinedRow` in the call sites absorb the mismatch — PostgREST's nested-select return shapes are notoriously hard to express in the generated types.

- [ ] **Step 4.3: Run application tests (sanity)**

```bash
pnpm --filter @kc/application test
```

Expected: all pre-existing tests still green.

---

## Task 5: Re-export the adapter

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 5.1: Append the export**

Open `app/packages/infrastructure-supabase/src/index.ts`. After the `SupabaseCityRepository` line, add:

```typescript
export { SupabasePostRepository } from './posts/SupabasePostRepository';
```

The full file should now be:

```typescript
export { getSupabaseClient, resetSupabaseClient } from './client';
export type { SupabaseAuthStorage } from './client';
export type { Database } from './database.types';

export { SupabaseAuthService } from './auth/SupabaseAuthService';
export { SupabaseUserRepository } from './users/SupabaseUserRepository';
export { SupabaseCityRepository } from './cities/SupabaseCityRepository';
export { SupabasePostRepository } from './posts/SupabasePostRepository';
```

- [ ] **Step 5.2: Full repo typecheck + tests + lint**

```bash
pnpm typecheck
pnpm test
```

Expected: both pass across all 5 packages. Per `git-workflow.mdc` §4 these are the pre-push gates.

- [ ] **Step 5.3: Commit the implementation**

```bash
git add app/packages/infrastructure-supabase/src/posts/ \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infrastructure-supabase): SupabasePostRepository (P0.4-BE)

Implements IPostRepository for create/update/delete/findById/getFeed/
getMyPosts/countOpenByUser. RLS handles visibility; DB triggers handle
the active-post cap, image cap, and visibility-upgrade-only rule.
close()/reopen() are P0.6 stubs.

Mapped to SRS: FR-POST-001..004, 008..011, 014; FR-FEED-001..005, 013.
Refactor logged: NA."
```

---

## Task 6: SSOT updates — `PROJECT_STATUS.md`

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

Per parallel-agents §7, edits to this file are append-only or counter-recompute style and ship as the final commit.

- [ ] **Step 6.1: §3 Sprint Board — replace the "Up next" row**

Find the §3 table. Replace the row:

```
| Up next | P0.4 — Post creation + feed CRUD | — | — | — |
```

with:

```
| In progress | P0.4-BE — Posts adapter + storage upload | agent-be | 2026-05-08 | — |
| Up next | P0.4-FE — Feed UI + Create form (consumes adapter) | — | — | — |
```

- [ ] **Step 6.2: §4 — append the completion entry at the top of the log**

Right after the `## 4. Completed Features Log` heading and the `Append-only. **Newest at top.**` line, insert:

```markdown
---

### 🟢 P0.4-BE — Posts repository adapter (Supabase)
- **SRS**: FR-POST-001..004, 008..011, 014; FR-FEED-001..005, 013
- **Branch**: `feat/FR-POST-001-be-posts-repo` · 2026-05-08
- **Tests**: tsc clean (all 5 packages); existing 25 vitest still green; no new tests (adapter mirrors `SupabaseAuthService` pattern — see TD-50)
- **Tech debt**: TD-13 partially resolved (close/reopen still stubbed for P0.6); adds TD-50 (no-tests for infra adapters)
- **Open gaps**: FR-CLOSURE-* (P0.6) · image upload from device FR-POST-005 (P0.4-FE) · realtime feed FR-FEED-014 (P1.2) · `update()` does not change mediaAssets (image swap on edit deferred)
```

- [ ] **Step 6.3: §6 Tech Debt — flip TD-13 status and append TD-50**

Find the TD-13 row:

```
| TD-13 | No `IPostRepository` Supabase adapter — port declared, no implementation. Mock data still consumed by feed/create/post detail. (AUDIT-P0-01) | High | Audit 2026-05-07 | Open (P0.4) |
```

Replace its **Status** cell (last column) with:

```
🟡 Partial — adapter ships in P0.4-BE 2026-05-08; close/reopen remain `not_implemented('P0.6')` until closure slice; FE wiring still mock-backed until P0.4-FE merges
```

Append a new row at the bottom of the table:

```
| TD-50 | `SupabasePostRepository` and `SupabaseAuthService` have no adapter-level tests (only `pnpm typecheck` + downstream use-case fakes guard them). Pure helpers (`mapPostRow`, `cursor.ts`, `mapAuthError`) deserve unit tests. Adding vitest to `@kc/infrastructure-supabase` is a small, focused slice. | Med | P0.4-BE 2026-05-08 | Open |
```

- [ ] **Step 6.4: §1 Snapshot — bump "Last Updated" and counters**

Find the `Last Updated` row in the top metadata table and update its value to:

```
2026-05-08 (P0.4-BE — Posts repository adapter; TD-13 partial; TD-50 logged)
```

Find the `## 1. Snapshot — Current State (2026-05-07)` heading and update to:

```
## 1. Snapshot — Current State (2026-05-08)
```

In the `Snapshot` table itself, update:
- `MVP completion (rough)` row's value to `~22%` (was `~18%`).
- `Open tech-debt items` row's value to `4` (was `3` — net effect: TD-13 still counts as it's only partial, TD-50 is new).

- [ ] **Step 6.5: §5 — no new decision; skip.**

- [ ] **Step 6.6: Verify the file still parses as Markdown and is internally consistent**

```bash
grep -n "TD-13" docs/SSOT/PROJECT_STATUS.md
grep -n "TD-50" docs/SSOT/PROJECT_STATUS.md
grep -n "P0.4-BE" docs/SSOT/PROJECT_STATUS.md
```

Expected: TD-13 appears once in §6 with the updated status; TD-50 appears once at bottom of §6; P0.4-BE appears in §3, §4, §6 (4 lines total).

- [ ] **Step 6.7: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md
git commit -m "docs(status): P0.4-BE landed; TD-13 partial; TD-50 logged

Mapped to SRS: FR-POST-001..004, 008..011, 014; FR-FEED-001..005, 013.
Refactor logged: Yes (TD-50)."
```

---

## Task 7: Open the PR

- [ ] **Step 7.1: Push and open a draft PR (per parallel-agents §8.1, the draft = the lock; we did the work first because nothing else was claimed)**

```bash
git push -u origin feat/FR-POST-001-be-posts-repo
```

- [ ] **Step 7.2: Create the PR with the contract-changes section**

```bash
gh pr create --title "feat(BE): SupabasePostRepository (P0.4-BE)" --body "$(cat <<'EOF'
Mapped to SRS: FR-POST-001..004, 008..011, 014; FR-FEED-001..005, 013. Refactor logged: Yes (TD-50).

## Summary
- Implements `IPostRepository` against Supabase: create / update / delete / findById / getFeed (cursor-paginated, filter by type/category/city, search, sort) / getMyPosts / countOpenByUser.
- Closes TD-13 for the read/write surface. `close()` and `reopen()` are intentional `not_implemented('P0.6')` stubs — they need atomic post + recipients mutations and are owned by the closure slice.
- RLS (migration 0002) handles visibility transparently — adapter does not filter by visibility itself.

## Contract changes
- `packages/application/src/ports/IPostRepository.ts` — adds `MediaAssetInput`, `CreatePostInput`, `UpdatePostInput`; `create()` and `update()` now take these instead of `Omit<Post,...>` / `Partial<Post>`. No domain-type changes. No existing consumer (the only callers were `selectGuestPreviewPosts` and the mobile mock data; both consume `PostWithOwner`/`FeedPage`, both unchanged).

## Test plan
- [x] `pnpm typecheck` — all 5 packages clean
- [x] `pnpm test` — 25/25 vitest green (no new tests; matches `SupabaseAuthService` precedent — gap logged as TD-50)
- [ ] FE smoke test deferred to P0.4-FE (the slice that wires use cases + screens)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 7.3: Mark PR ready and enable auto-merge per `git-workflow.mdc` §5**

```bash
gh pr ready
gh pr merge --auto --squash --delete-branch
```

CI runs `pnpm typecheck` + `pnpm test` + `pnpm lint`. On green, the PR auto-squashes into main and the branch is deleted. If CI fails, fix on the same branch and push — auto-merge will re-trigger.

---

## Self-Review Checklist (run before declaring done)

- **Spec coverage**: Walked the SRS list (FR-POST-001..020, FR-FEED-001..005). All in-scope FRs have a code path; out-of-scope FRs (005 image upload, 007 draft, 013 expiry job, 020 advisory) are explicitly listed in "Out of scope" and have owning slices.
- **Placeholder scan**: No "TBD"/"implement later"/"add validation"/"similar to Task N". `close`/`reopen` deferred via explicit `NOT_IMPL`.
- **Type consistency**: `CreatePostInput` ↔ `mediaAssets: MediaAssetInput[]` ↔ `media_assets` row insert all line up. `UpdatePostInput` editable fields ↔ adapter's whitelist match. `PostJoinedRow.media_assets` and `mapPostRow` agree on snake_case.
- **Lane discipline**: All writes are in `packages/application/src/ports/` (BE-led shared contract), `packages/infrastructure-supabase/**` (BE-exclusive), and `docs/SSOT/PROJECT_STATUS.md` (shared docs, append-only / counter-recompute pattern). Zero writes into `apps/mobile` or `packages/ui`.
- **Contract commit isolated**: Task 1 produces the only commit that touches `packages/application`; subsequent commits are infrastructure + docs.
- **Verification gate**: `Mapped to SRS: ... Refactor logged: ...` is present in PR body, in commit messages, and (on plan delivery) in the assistant's response wrapper.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-p0-4-be-posts-repo.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks. Best for keeping the BE main context clean while the FE agent runs in parallel.
2. **Inline Execution** — Execute tasks here, batch with checkpoints. Faster end-to-end, larger context footprint.

Which approach?
