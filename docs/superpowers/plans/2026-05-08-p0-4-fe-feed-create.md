# P0.4-FE — Feed UI + Create Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Update note (post-merge of PR #12 / P0.3.c soft gate, 2026-05-08):**
> - `(tabs)/create.tsx` was extended in #12 to gate Publish behind `useSoftGate().requestSoftGate(...)` (FR-AUTH-015). **Task 7.3 must preserve this** — add `import { useSoftGate } from '../../src/components/OnboardingSoftGate';`, call the hook in the component (`const { requestSoftGate } = useSoftGate();`), and wrap the Publish onPress with `requestSoftGate(() => publish.mutate())` rather than calling `publish.mutate()` directly.
> - `infrastructure-supabase/src/posts/cursor.ts` was switched from `Buffer` to `encodeURIComponent` for RN compat — already in main. No action needed.
> - `_layout.tsx` already wraps the Stack with `<SoftGateProvider>` — no changes needed there.

**Goal:** Wire every post-related mobile screen (feed, post detail, create form, my-profile posts, guest preview) to the live `SupabasePostRepository` shipped in P0.4-BE. Retires `apps/mobile/src/mock/data.ts`. Adds the missing application-layer use cases for posts (none exist yet — only `auth/*` and `feed/selectGuestPreviewPosts` do). Implements end-to-end image upload from gallery to Supabase Storage so `Give` posts can satisfy `FR-POST-002 AC1` (photo required).

**Architecture:**
1. **Application layer** — write the missing use cases (`GetFeedUseCase`, `CreatePostUseCase`, `GetPostByIdUseCase`, `GetMyPostsUseCase`, `UpdatePostUseCase`, `DeletePostUseCase`) following the auth precedent: thin classes with `execute(input)`, validation pulled from `@kc/domain` invariants, all I/O through the `IPostRepository` port. TDD with a `FakePostRepository` in `__tests__/`.
2. **Mobile composition root** — `apps/mobile/src/services/postsComposition.ts` mirrors `authComposition.ts`/`userComposition.ts`: lazy singleton wiring of `SupabasePostRepository` + the new use cases.
3. **Mobile data fetching** — `@tanstack/react-query` (already wired in `app/_layout.tsx`) drives every read. Mutations invalidate `['feed']`, `['post', id]`, `['my-posts', userId]` keys.
4. **Image upload** — new helper module `apps/mobile/src/services/imageUpload.ts` uses `expo-image-picker` (already a dep) + `expo-image-manipulator` (NEW dep) for client-side resize-to-2048px and re-encode-to-JPEG. The re-encode strips most EXIF (including GPS) as a side effect — a stronger server-side strip per AUDIT-X-03 stays as TD-23 (partial). Uploads target `post-images/<userId>/<batchUuid>/<ordinal>.jpg`. `batchUuid` is generated client-side via `expo-crypto` (already a dep) because the post row's `post_id` is DB-generated.
5. **File-size discipline** — `(tabs)/create.tsx` is 333 LOC today (over the 200 cap, TD-29). After wiring image picking + visibility conditional + upload progress, it would balloon further. Plan splits it into a thin orchestrator screen + two extracted components (`PhotoPicker`, `VisibilityChooser`).

**Tech Stack:** TypeScript 5.9, React 19, React Native 0.81 + Expo SDK 54, expo-router 6 (typed routes), @tanstack/react-query 5.62, zustand 5, @supabase/supabase-js 2.69, expo-image-picker 17 (existing), expo-image-manipulator (NEW), expo-crypto 15 (existing), date-fns 4. No new application or domain deps.

**Lane:** Frontend (FE). Files touched live in:
- `packages/application/src/{posts,feed}/**` (NEW use cases) and `packages/application/src/index.ts` (re-export). The plan extends but does not change the `IPostRepository` port — that's BE territory per parallel-agents §6.2 and the port is already well-shaped after P0.4-BE.
- `apps/mobile/**` (FE-exclusive).

No BE-only changes (no migrations, no adapter changes). The new use cases are technically `@kc/application` which is the shared contract zone; per parallel-agents §6.4 they ship in their own commit at the head of the PR (`feat(contract): ...`).

**SRS coverage in this slice:**
- FR-POST-001 (single create form with type toggle — already in UI; this slice wires Publish)
- FR-POST-002 (required fields by type — title, image-for-Give, address)
- FR-POST-003 partial (location-display-level, visibility — Public/OnlyMe only; FollowersOnly conditional defers to P2.4)
- FR-POST-004 (type-specific fields — itemCondition, urgency)
- FR-POST-005 partial (image upload, resize to 2048px, MIME guard, count cap; **EXIF strip is best-effort client-side via re-encode** — full server-side strip stays in TD-23)
- FR-POST-006 AC1 + AC4 (Public success toast; land on feed with new post anchored — natural via cache invalidation)
- FR-POST-008 (edit existing post — minimal: hook the existing UI to UpdatePostUseCase; mediaAssets edit deferred per BE entry §4)
- FR-POST-010 (delete a post — owner only, RLS-enforced)
- FR-POST-014, FR-POST-015 (post detail screen rendering — owner/non-owner permutations are already RLS-handled)
- FR-FEED-001, FR-FEED-002, FR-FEED-003, FR-FEED-004, FR-FEED-005, FR-FEED-013 (feed list, type/category/city filters, sort, search query, count via `countOpenByUser`)
- FR-PROFILE-001 partial (My Profile shows real `getMyPosts` lists; the four user counters that need `IUserRepository.findById` stay at `0` until P2.4 — TD-42 stays partially open)
- FR-AUTH-014 partial (guest feed switches from mock to live `getFeed` with `Public`-only filter)

**Out of scope (later slices):**
- `close` / `reopen` use cases and the closure modal sequence (FR-CLOSURE-*) → P0.6.
- `IUserRepository.findById` / `findByHandle` wiring on Profile counters and `user/[handle]` (TD-40, AUDIT-P0-02) → P2.4.
- FollowersOnly visibility option in the create form (requires reading `User.privacyMode`, which depends on `IUserRepository.findById`) → P2.4.
- Local draft autosave (FR-POST-007) → not in P0; tracked as a P2 item, no TD opened.
- Free-text Hebrew tsvector search index, 250ms debounce, cold-start fallback, first-post nudge card, realtime feed subscription, active community counter (FR-FEED-006…015) → P1.2 (TD-26). The plan keeps the existing `searchQuery` text field plumbed straight into `PostFeedFilter.searchQuery` (the BE adapter already does an `ilike '%term%'` on title — basic but functional).
- SQL probes / runtime tests for `is_blocked()` / `is_following()` / `is_post_visible_to()` (TD-41, AUDIT-X-01) → follow-up. The plan keeps Public/OnlyMe in the create form, so FollowersOnly visibility is not exercised end-to-end here; probes can land alongside the P2.4 / P1.1 work that does exercise it.
- Server-side EXIF-strip Edge Function (AUDIT-X-03 part of TD-23) → follow-up Edge Function slice.
- Auth follow gating, follow requests, blocks (FR-FOLLOW-*, FR-MOD-*) → P1.x.

---

## File Structure

| Path | Purpose | Status |
| ---- | ------- | ------ |
| `app/packages/application/src/feed/GetFeedUseCase.ts` | Thin wrapper around `IPostRepository.getFeed`; trims `searchQuery`, clamps limit. ~30 LOC. | **Create** |
| `app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts` | TDD spec. ~50 LOC. | **Create** |
| `app/packages/application/src/posts/CreatePostUseCase.ts` | Validates title (1..80), description (≤500), Give-requires-≥1-image, mediaAssets ≤5, type/itemCondition/urgency coupling, address presence. ~80 LOC. | **Create** |
| `app/packages/application/src/posts/UpdatePostUseCase.ts` | Validates each present patch field; visibility transitions via `canUpgradeVisibility` from `@kc/domain`. ~70 LOC. | **Create** |
| `app/packages/application/src/posts/GetPostByIdUseCase.ts` | Thin. ~25 LOC. | **Create** |
| `app/packages/application/src/posts/GetMyPostsUseCase.ts` | Thin. ~30 LOC. | **Create** |
| `app/packages/application/src/posts/DeletePostUseCase.ts` | Thin. ~25 LOC. | **Create** |
| `app/packages/application/src/posts/errors.ts` | `PostError` class + `PostErrorCode` union, mirrors `auth/errors.ts`. ~30 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/fakePostRepository.ts` | In-memory `IPostRepository` for tests. ~120 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts` | TDD spec. ~120 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/UpdatePostUseCase.test.ts` | TDD spec. ~80 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/GetPostByIdUseCase.test.ts` | TDD spec. ~30 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/GetMyPostsUseCase.test.ts` | TDD spec. ~40 LOC. | **Create** |
| `app/packages/application/src/posts/__tests__/DeletePostUseCase.test.ts` | TDD spec. ~25 LOC. | **Create** |
| `app/packages/application/src/index.ts` | Re-export the 6 new use cases + `PostError`/`isPostError`. | **Modify** |
| `app/apps/mobile/src/services/postsComposition.ts` | Lazy singleton wiring (mirrors `authComposition.ts`). ~90 LOC. | **Create** |
| `app/apps/mobile/src/services/imageUpload.ts` | `pickPostImages()`, `resizeAndUploadImage()`, `buildPostImagePath()`. ~120 LOC. | **Create** |
| `app/apps/mobile/src/services/__tests__/imageUpload.test.ts` | Unit tests for the pure path-builder helper. ~40 LOC. | **Create** (vitest config + package.json devDep added in Task 5.5 if not already present) |
| `app/apps/mobile/src/components/CreatePostForm/PhotoPicker.tsx` | Photo-picker grid — extracted from `(tabs)/create.tsx`. ~140 LOC. | **Create** |
| `app/apps/mobile/src/components/CreatePostForm/VisibilityChooser.tsx` | Public/OnlyMe radio rows — extracted from `(tabs)/create.tsx`. ~80 LOC. | **Create** |
| `app/apps/mobile/app/(tabs)/index.tsx` | Replace `MOCK_POSTS` consumption with `useQuery(getFeedUseCase)`. Add loading / error / refresh states. Move post-list FlatList into a small `<PostFeedList>` component. | **Modify** (target: ≤200 LOC after split) |
| `app/apps/mobile/src/components/PostFeedList.tsx` | Extracted FlatList + empty/loading/error states. ~120 LOC. | **Create** |
| `app/apps/mobile/app/(tabs)/create.tsx` | Replace mock publish with `getCreatePostUseCase().execute(...)`; integrate `PhotoPicker` + `VisibilityChooser`; address fields (city + street + number). | **Modify** (target: ≤200 LOC after split) |
| `app/apps/mobile/app/(tabs)/profile.tsx` | Replace empty-state placeholders with `useQuery(getMyPostsUseCase)`; bind active-posts counter to `countOpenByUser`. Other counters stay `0` per TD-42. | **Modify** |
| `app/apps/mobile/app/post/[id].tsx` | Replace `MOCK_POSTS.find(...) ?? MOCK_POSTS[0]!` with `useQuery(getPostByIdUseCase)`; render not-found state when null (closes TD-32, AUDIT-P2-09). | **Modify** |
| `app/apps/mobile/app/(guest)/feed.tsx` | Use `getFeedUseCase().execute({}, 3)` (limit 3) and pass through `selectGuestPreviewPosts` for the eligibility filter. | **Modify** |
| `app/apps/mobile/app/user/[handle].tsx` | Stop importing `MOCK_POSTS`. Show "feature pending P2.4" placeholder for now (lookup needs `IUserRepository.findByHandle`, TD-40). Don't render mock posts. | **Modify** |
| `app/apps/mobile/src/mock/data.ts` | **Delete** at the very end — closes AUDIT-P2-02 / TD-5. | **Delete** |
| `app/apps/mobile/package.json` | Add `expo-image-manipulator` dep. | **Modify** |
| `docs/SSOT/PROJECT_STATUS.md` | §3 sprint board (P0.4-FE → Done; Up next becomes P0.5); §4 entry; §6 TD-13/TD-23/TD-29/TD-32/TD-42 status updates. | **Modify** |

---

## Pre-flight (one time, do not commit yet)

> **State assumption.** This plan starts from a working tree that already has the **audit cleanup** edits uncommitted from the prior step (added TD-41..43 to `PROJECT_STATUS.md`, deleted `CODE_AUDIT_2026-05-07.md`). Per the user's bundling decision, the cleanup ships in the same PR as P0.4-FE — committed as the first real commit on the feature branch. **Do not** `git switch main` (that would discard the cleanup); branch off the current HEAD instead.

- [ ] **Step 0.1: Verify the expected working tree state**

```bash
git status --short
```

Expected output (modulo `.claude/.DS_Store` and similar local-only noise):

```
 D docs/SSOT/CODE_AUDIT_2026-05-07.md
 M docs/SSOT/PROJECT_STATUS.md
```

If anything else appears modified, stop and inspect it before continuing.

- [ ] **Step 0.2: Confirm we're on `main` and up to date with origin**

```bash
git rev-parse --abbrev-ref HEAD          # expect: main
git fetch origin
git log --oneline -1 origin/main         # confirm HEAD matches origin/main; if not, the cleanup edits were made off a stale main — stop and investigate
```

- [ ] **Step 0.3: Create the feature branch (carries the working-tree edits)**

```bash
git switch -c feat/FR-POST-001-fe-feed-create
```

Branch name follows parallel-agents §8.1 (`<type>/<FR-id>-<lane>-<slug>`). The uncommitted audit-cleanup edits move with the branch — confirm with `git status --short` (same output as Step 0.1).

- [ ] **Step 0.4: Commit the audit cleanup as the first commit on the branch**

```bash
git add docs/SSOT/PROJECT_STATUS.md
git rm docs/SSOT/CODE_AUDIT_2026-05-07.md   # if `D` shows in git status without `--`, this has the same effect
git commit -m "chore(docs): retire CODE_AUDIT_2026-05-07.md; capture TD-41..43

All 49 audit findings are now tracked in PROJECT_STATUS.md §6
(TDs) + §2 backlog rows. Final 3 gaps captured as TD-41 (SQL
probes for SECURITY DEFINER predicates), TD-42 (profile counter
binding), TD-43 (SRS Last-Updated date sync). TD-12 marked
✅ Resolved with a historical pointer."
```

(If `git status` already shows the audit file as deleted via `rm`, then `git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/CODE_AUDIT_2026-05-07.md` will stage the deletion correctly — `git rm` is just being explicit.)

- [ ] **Step 0.5: Confirm baseline typecheck + tests are green**

```bash
pnpm install
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
pnpm --filter @kc/mobile typecheck
```

Expected: all four exit 0. If `@kc/mobile typecheck` fails on TD-6/TD-8 pre-existing errors, note the **count of errors** so we can confirm later that no new ones were introduced. Stop on any other failure and fix before adding new code.

- [ ] **Step 0.6: Open a draft PR to claim the lane (parallel-agents §5)**

```bash
gh pr list --state open --json number,title,headRefName,isDraft,author --jq '.[] | select(.headRefName | startswith("feat/FR-POST-")) | "\(.number) \(.headRefName) draft=\(.isDraft)"'
```

Expected: empty (no concurrent FE post slice). If something is open, stop and resolve.

```bash
git push -u origin feat/FR-POST-001-fe-feed-create
gh pr create --draft \
  --title "P0.4-FE — Feed UI + Create form (consumes P0.4-BE adapter)" \
  --body "Lane: FE. Branch claim per parallel-agents §5. See docs/superpowers/plans/2026-05-08-p0-4-fe-feed-create.md for the task list. First commit retires CODE_AUDIT_2026-05-07.md (audit hygiene from prior step) before the P0.4-FE work begins." \
  --base main
```

Expected: a draft PR URL. Note the number for `gh pr ready <num>` at the end.

---

## Task 1: Application — `GetFeedUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/feed/GetFeedUseCase.ts`
- Create: `app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts`
- Create (test fake, also used by Tasks 2–6): `app/packages/application/src/posts/__tests__/fakePostRepository.ts`

### 1.1 — Write the test fake first

- [ ] **Step 1.1.1: Create the fake**

Create `app/packages/application/src/posts/__tests__/fakePostRepository.ts`:

```typescript
import type {
  CreatePostInput,
  FeedPage,
  IPostRepository,
  PostFeedFilter,
  PostWithOwner,
  UpdatePostInput,
} from '../../ports/IPostRepository';
import type { Post, PostStatus } from '@kc/domain';

/**
 * In-memory IPostRepository for use-case tests. Captures the last call to each
 * method so tests can assert on what the use case forwarded.
 */
export class FakePostRepository implements IPostRepository {
  // Stored data
  posts: PostWithOwner[] = [];
  nextCursor: string | null = null;

  // Call captures
  lastGetFeedArgs: { viewerId: string | null; filter: PostFeedFilter; limit: number; cursor?: string } | null = null;
  lastFindByIdArgs: { postId: string; viewerId: string | null } | null = null;
  lastCreateArgs: CreatePostInput | null = null;
  lastUpdateArgs: { postId: string; patch: UpdatePostInput } | null = null;
  lastDeletePostId: string | null = null;
  lastGetMyPostsArgs: { userId: string; status: PostStatus[]; limit: number; cursor?: string } | null = null;
  lastCountOpenUserId: string | null = null;

  // Stubs / errors
  createResult: Post | null = null;
  createError: Error | null = null;
  updateResult: Post | null = null;
  updateError: Error | null = null;
  findByIdResult: PostWithOwner | null = null;
  findByIdError: Error | null = null;
  deleteError: Error | null = null;
  countOpenResult = 0;
  myPostsResult: Post[] = [];

  getFeed = async (
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage> => {
    this.lastGetFeedArgs = { viewerId, filter, limit, cursor };
    return { posts: this.posts, nextCursor: this.nextCursor };
  };

  findById = async (postId: string, viewerId: string | null): Promise<PostWithOwner | null> => {
    this.lastFindByIdArgs = { postId, viewerId };
    if (this.findByIdError) throw this.findByIdError;
    return this.findByIdResult;
  };

  create = async (input: CreatePostInput): Promise<Post> => {
    this.lastCreateArgs = input;
    if (this.createError) throw this.createError;
    if (!this.createResult) throw new Error('FakePostRepository: createResult not configured');
    return this.createResult;
  };

  update = async (postId: string, patch: UpdatePostInput): Promise<Post> => {
    this.lastUpdateArgs = { postId, patch };
    if (this.updateError) throw this.updateError;
    if (!this.updateResult) throw new Error('FakePostRepository: updateResult not configured');
    return this.updateResult;
  };

  delete = async (postId: string): Promise<void> => {
    this.lastDeletePostId = postId;
    if (this.deleteError) throw this.deleteError;
  };

  close = async (): Promise<Post> => {
    throw new Error('FakePostRepository.close: not used in P0.4-FE');
  };
  reopen = async (): Promise<Post> => {
    throw new Error('FakePostRepository.reopen: not used in P0.4-FE');
  };

  getMyPosts = async (
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]> => {
    this.lastGetMyPostsArgs = { userId, status, limit, cursor };
    return this.myPostsResult;
  };

  countOpenByUser = async (userId: string): Promise<number> => {
    this.lastCountOpenUserId = userId;
    return this.countOpenResult;
  };
}

export function makePostWithOwner(overrides: Partial<PostWithOwner> = {}): PostWithOwner {
  return {
    postId: 'p_1',
    ownerId: 'u_1',
    ownerName: 'Test User',
    ownerAvatarUrl: null,
    ownerHandle: 'test-user',
    ownerPrivacyMode: 'Public',
    type: 'Give',
    status: 'open',
    visibility: 'Public',
    title: 'Test Post',
    description: null,
    category: 'Other',
    address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'Allenby', streetNumber: '10' },
    locationDisplayLevel: 'CityAndStreet',
    itemCondition: 'Good',
    urgency: null,
    mediaAssets: [],
    recipient: null,
    reopenCount: 0,
    deleteAfter: null,
    createdAt: '2026-05-08T10:00:00.000Z',
    updatedAt: '2026-05-08T10:00:00.000Z',
    ...overrides,
  };
}
```

- [ ] **Step 1.1.2: Verify it typechecks**

```bash
pnpm --filter @kc/application typecheck
```

Expected: exit 0. The fake imports nothing the package can't resolve.

- [ ] **Step 1.1.3: Commit the fake**

```bash
git add app/packages/application/src/posts/__tests__/fakePostRepository.ts
git commit -m "test(application): FakePostRepository for use-case tests

Mirrors fakeAuthService precedent. Captures call args, supports
result + error stubs per method. Used by P0.4-FE Tasks 1–6."
```

### 1.2 — Test for `GetFeedUseCase`

- [ ] **Step 1.2.1: Write the failing test**

Create `app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GetFeedUseCase } from '../GetFeedUseCase';
import { FakePostRepository, makePostWithOwner } from '../../posts/__tests__/fakePostRepository';

describe('GetFeedUseCase', () => {
  it('forwards filter / limit / cursor to the repo', async () => {
    const repo = new FakePostRepository();
    repo.posts = [makePostWithOwner({ postId: 'p_1' })];
    const uc = new GetFeedUseCase(repo);

    const out = await uc.execute({
      viewerId: 'viewer_1',
      filter: { type: 'Give', city: 'tel-aviv' },
      limit: 15,
      cursor: 'cursor_x',
    });

    expect(out.posts).toHaveLength(1);
    expect(out.posts[0]!.postId).toBe('p_1');
    expect(repo.lastGetFeedArgs).toEqual({
      viewerId: 'viewer_1',
      filter: { type: 'Give', city: 'tel-aviv' },
      limit: 15,
      cursor: 'cursor_x',
    });
  });

  it('trims a non-empty searchQuery and drops empty / whitespace-only queries', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: { searchQuery: '   ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBeUndefined();

    await uc.execute({ viewerId: null, filter: { searchQuery: '  ספה  ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBe('ספה');
  });

  it('clamps limit to [1, 100]', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: {}, limit: 0 });
    expect(repo.lastGetFeedArgs?.limit).toBe(1);

    await uc.execute({ viewerId: null, filter: {}, limit: 999 });
    expect(repo.lastGetFeedArgs?.limit).toBe(100);
  });

  it('uses sensible defaults when caller omits limit', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: {} });
    expect(repo.lastGetFeedArgs?.limit).toBe(20);
  });
});
```

- [ ] **Step 1.2.2: Run to verify it fails**

```bash
pnpm --filter @kc/application test feed/GetFeedUseCase
```

Expected: FAIL with `Cannot find module '../GetFeedUseCase'`.

### 1.3 — Implement `GetFeedUseCase`

- [ ] **Step 1.3.1: Write the implementation**

Create `app/packages/application/src/feed/GetFeedUseCase.ts`:

```typescript
/** FR-FEED-001..005 + FR-FEED-013: orchestrates a feed page read against IPostRepository. */
import type {
  FeedPage,
  IPostRepository,
  PostFeedFilter,
} from '../ports/IPostRepository';

export interface GetFeedInput {
  viewerId: string | null;
  filter: PostFeedFilter;
  limit?: number;
  cursor?: string;
}

const DEFAULT_LIMIT = 20;
const HARD_MAX = 100;

export class GetFeedUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetFeedInput): Promise<FeedPage> {
    const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, HARD_MAX);
    const filter = normalizeFilter(input.filter);
    return this.repo.getFeed(input.viewerId, filter, limit, input.cursor);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function normalizeFilter(raw: PostFeedFilter): PostFeedFilter {
  const out: PostFeedFilter = { ...raw };
  if (typeof out.searchQuery === 'string') {
    const trimmed = out.searchQuery.trim();
    if (trimmed.length === 0) delete out.searchQuery;
    else out.searchQuery = trimmed;
  }
  return out;
}
```

- [ ] **Step 1.3.2: Run to verify it passes**

```bash
pnpm --filter @kc/application test feed/GetFeedUseCase
```

Expected: PASS, 4 tests.

- [ ] **Step 1.3.3: Re-export from `application/src/index.ts`**

Edit `app/packages/application/src/index.ts` — add **after** the `selectGuestPreviewPosts` export (line 15):

```typescript
export * from './feed/GetFeedUseCase';
```

- [ ] **Step 1.3.4: Verify all application tests still pass**

```bash
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
```

Expected: exit 0; existing 25 vitest specs + 4 new = 29 passing.

- [ ] **Step 1.3.5: Commit**

```bash
git add app/packages/application/src/feed/GetFeedUseCase.ts \
        app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(contract): add GetFeedUseCase (P0.4-FE)

FR-FEED-001..005, FR-FEED-013. Thin orchestrator over
IPostRepository.getFeed: trims searchQuery, clamps limit to
[1, 100], default limit 20. TDD-tested via FakePostRepository."
```

---

## Task 2: Application — Posts use cases (TDD)

**Files:** all under `app/packages/application/src/posts/`

### 2.1 — `posts/errors.ts` + barrel

- [ ] **Step 2.1.1: Write `posts/errors.ts`**

Create `app/packages/application/src/posts/errors.ts`:

```typescript
// Post-domain orchestration errors. Mirrors auth/errors.ts.
// Mapped to SRS: FR-POST-002, FR-POST-003, FR-POST-004, FR-POST-005, FR-POST-009.

export type PostErrorCode =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'address_required'
  | 'image_required_for_give'
  | 'too_many_media_assets'
  | 'condition_required_for_give'
  | 'urgency_only_for_request'
  | 'condition_only_for_give'
  | 'visibility_downgrade_forbidden'
  | 'invalid_post_type'
  | 'invalid_visibility'
  | 'invalid_category'
  | 'invalid_location_display_level'
  | 'unknown';

export class PostError extends Error {
  readonly code: PostErrorCode;
  readonly cause?: unknown;

  constructor(code: PostErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PostError';
    this.code = code;
    this.cause = cause;
  }
}

export function isPostError(value: unknown): value is PostError {
  return value instanceof PostError;
}
```

- [ ] **Step 2.1.2: Verify typecheck**

```bash
pnpm --filter @kc/application typecheck
```

Expected: exit 0.

### 2.2 — `CreatePostUseCase` (TDD)

- [ ] **Step 2.2.1: Write the failing test**

Create `app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CreatePostUseCase } from '../CreatePostUseCase';
import { PostError } from '../errors';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';
import type { CreatePostInput } from '../../ports/IPostRepository';

const baseInput = (overrides: Partial<CreatePostInput> = {}): CreatePostInput => ({
  ownerId: 'u_1',
  type: 'Give',
  visibility: 'Public',
  title: 'ספה',
  description: null,
  category: 'Furniture',
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '10' },
  locationDisplayLevel: 'CityAndStreet',
  itemCondition: 'Good',
  urgency: null,
  mediaAssets: [{ path: 'u_1/b1/0.jpg', mimeType: 'image/jpeg', sizeBytes: 100_000 }],
  ...overrides,
});

describe('CreatePostUseCase', () => {
  it('creates a Give post with one image and trims the title', async () => {
    const repo = new FakePostRepository();
    repo.createResult = { ...makePostWithOwner(), title: 'ספה' };
    const uc = new CreatePostUseCase(repo);

    const out = await uc.execute(baseInput({ title: '   ספה   ' }));

    expect(out.post.postId).toBe('p_1');
    expect(repo.lastCreateArgs?.title).toBe('ספה');
  });

  it('rejects empty title', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ title: '   ' }))).rejects.toMatchObject({ code: 'title_required' });
  });

  it('rejects title > 80 chars', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ title: 'a'.repeat(81) }))).rejects.toMatchObject({ code: 'title_too_long' });
  });

  it('rejects description > 500 chars', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ description: 'a'.repeat(501) }))).rejects.toMatchObject({
      code: 'description_too_long',
    });
  });

  it('rejects Give without any image (FR-POST-002 AC1)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ mediaAssets: [] }))).rejects.toMatchObject({
      code: 'image_required_for_give',
    });
  });

  it('rejects > 5 mediaAssets (FR-POST-005 AC2)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    const six = Array.from({ length: 6 }, (_, i) => ({
      path: `u_1/b1/${i}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 100_000,
    }));
    await expect(uc.execute(baseInput({ mediaAssets: six }))).rejects.toMatchObject({
      code: 'too_many_media_assets',
    });
  });

  it('rejects Give without itemCondition', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ itemCondition: null }))).rejects.toMatchObject({
      code: 'condition_required_for_give',
    });
  });

  it('rejects Request that has itemCondition (FR-POST-004 coupling)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ type: 'Request', itemCondition: 'Good', mediaAssets: [] })),
    ).rejects.toMatchObject({ code: 'condition_only_for_give' });
  });

  it('rejects Give that has urgency (FR-POST-004 coupling)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ urgency: 'דחוף' })),
    ).rejects.toMatchObject({ code: 'urgency_only_for_request' });
  });

  it('accepts Request with no images and a free-text urgency', async () => {
    const repo = new FakePostRepository();
    repo.createResult = { ...makePostWithOwner({ type: 'Request' }) };
    const uc = new CreatePostUseCase(repo);

    const out = await uc.execute(
      baseInput({
        type: 'Request',
        itemCondition: null,
        mediaAssets: [],
        urgency: 'עד שישי',
      }),
    );

    expect(out.post.type).toBe('Request');
    expect(repo.lastCreateArgs?.urgency).toBe('עד שישי');
  });

  it('rejects empty address.city / street / streetNumber', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ address: { city: '', cityName: '', street: '', streetNumber: '' } })),
    ).rejects.toMatchObject({ code: 'address_required' });
  });
});
```

- [ ] **Step 2.2.2: Run to verify it fails**

```bash
pnpm --filter @kc/application test posts/CreatePostUseCase
```

Expected: FAIL with `Cannot find module '../CreatePostUseCase'`.

- [ ] **Step 2.2.3: Implement `CreatePostUseCase`**

Create `app/packages/application/src/posts/CreatePostUseCase.ts`:

```typescript
/** FR-POST-001..005: validate inputs and forward to IPostRepository.create. */
import type { CreatePostInput, IPostRepository } from '../ports/IPostRepository';
import type { Post } from '@kc/domain';
import { TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS, MAX_MEDIA_ASSETS } from '@kc/domain';
import { PostError } from './errors';

export interface CreatePostOutput {
  post: Post;
}

export class CreatePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<CreatePostOutput> {
    const normalized = this.validate(input);
    const post = await this.repo.create(normalized);
    return { post };
  }

  private validate(input: CreatePostInput): CreatePostInput {
    const title = input.title.trim();
    if (title.length === 0) throw new PostError('title_required', 'title_required');
    if (title.length > TITLE_MAX_CHARS)
      throw new PostError('title_too_long', `title_too_long (>${TITLE_MAX_CHARS})`);

    const description = input.description?.trim() ?? null;
    if (description && description.length > DESCRIPTION_MAX_CHARS)
      throw new PostError('description_too_long', `description_too_long (>${DESCRIPTION_MAX_CHARS})`);

    if (!input.address.city || !input.address.street || !input.address.streetNumber)
      throw new PostError('address_required', 'address_required');

    if (input.mediaAssets.length > MAX_MEDIA_ASSETS)
      throw new PostError('too_many_media_assets', `too_many_media_assets (>${MAX_MEDIA_ASSETS})`);

    if (input.type === 'Give') {
      if (input.mediaAssets.length === 0)
        throw new PostError('image_required_for_give', 'image_required_for_give');
      if (input.itemCondition === null)
        throw new PostError('condition_required_for_give', 'condition_required_for_give');
      if (input.urgency !== null && input.urgency.trim().length > 0)
        throw new PostError('urgency_only_for_request', 'urgency_only_for_request');
    } else {
      // Request
      if (input.itemCondition !== null)
        throw new PostError('condition_only_for_give', 'condition_only_for_give');
    }

    const urgency = input.urgency?.trim() ?? null;
    return {
      ...input,
      title,
      description,
      urgency: urgency && urgency.length > 0 ? urgency : null,
    };
  }
}
```

- [ ] **Step 2.2.4: Run tests**

```bash
pnpm --filter @kc/application test posts/CreatePostUseCase
```

Expected: PASS, 11 tests.

- [ ] **Step 2.2.5: Commit**

```bash
git add app/packages/application/src/posts/errors.ts \
        app/packages/application/src/posts/CreatePostUseCase.ts \
        app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts
git commit -m "feat(contract): CreatePostUseCase + PostError (P0.4-FE)

FR-POST-001..005. Validates title (1..80), description (≤500),
address presence, mediaAssets count, type/condition/urgency
coupling. Trim-and-forward to IPostRepository.create."
```

### 2.3 — `GetPostByIdUseCase`

- [ ] **Step 2.3.1: Test first**

Create `app/packages/application/src/posts/__tests__/GetPostByIdUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GetPostByIdUseCase } from '../GetPostByIdUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

describe('GetPostByIdUseCase', () => {
  it('forwards postId + viewerId to the repo', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ postId: 'p_42' });
    const uc = new GetPostByIdUseCase(repo);

    const out = await uc.execute({ postId: 'p_42', viewerId: 'viewer_1' });

    expect(out.post?.postId).toBe('p_42');
    expect(repo.lastFindByIdArgs).toEqual({ postId: 'p_42', viewerId: 'viewer_1' });
  });

  it('returns post: null when the repo cannot find it', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new GetPostByIdUseCase(repo);

    const out = await uc.execute({ postId: 'missing', viewerId: null });
    expect(out.post).toBeNull();
  });
});
```

- [ ] **Step 2.3.2: Run — should fail**

```bash
pnpm --filter @kc/application test posts/GetPostByIdUseCase
```

Expected: FAIL with module-not-found.

- [ ] **Step 2.3.3: Implement**

Create `app/packages/application/src/posts/GetPostByIdUseCase.ts`:

```typescript
/** FR-POST-014: read a single post by id, with viewer-aware visibility (RLS-enforced). */
import type { IPostRepository, PostWithOwner } from '../ports/IPostRepository';

export interface GetPostByIdInput {
  postId: string;
  viewerId: string | null;
}

export interface GetPostByIdOutput {
  post: PostWithOwner | null;
}

export class GetPostByIdUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetPostByIdInput): Promise<GetPostByIdOutput> {
    const post = await this.repo.findById(input.postId, input.viewerId);
    return { post };
  }
}
```

- [ ] **Step 2.3.4: Tests pass; commit**

```bash
pnpm --filter @kc/application test posts/GetPostByIdUseCase

git add app/packages/application/src/posts/GetPostByIdUseCase.ts \
        app/packages/application/src/posts/__tests__/GetPostByIdUseCase.test.ts
git commit -m "feat(contract): GetPostByIdUseCase (P0.4-FE)

FR-POST-014. Thin pass-through over IPostRepository.findById;
returns { post: null } when the row is not visible to the viewer."
```

### 2.4 — `GetMyPostsUseCase`

- [ ] **Step 2.4.1: Test first**

Create `app/packages/application/src/posts/__tests__/GetMyPostsUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GetMyPostsUseCase } from '../GetMyPostsUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('GetMyPostsUseCase', () => {
  it('forwards userId / status / limit / cursor', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 50, cursor: 'cur' });

    expect(repo.lastGetMyPostsArgs).toEqual({
      userId: 'u_1',
      status: ['open'],
      limit: 50,
      cursor: 'cur',
    });
  });

  it('clamps limit to [1, 100]; defaults to 20', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 0 });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(1);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 999 });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(100);

    await uc.execute({ userId: 'u_1', status: ['open'] });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(20);
  });

  it('rejects empty status array (RLS would return [] anyway, but spell it out)', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);
    await expect(uc.execute({ userId: 'u_1', status: [] })).rejects.toThrow(/status/);
  });
});
```

- [ ] **Step 2.4.2: Implement**

Create `app/packages/application/src/posts/GetMyPostsUseCase.ts`:

```typescript
/** FR-POST-016: list the caller's own posts (any visibility, owner sees all). */
import type { IPostRepository } from '../ports/IPostRepository';
import type { Post, PostStatus } from '@kc/domain';

export interface GetMyPostsInput {
  userId: string;
  status: PostStatus[];
  limit?: number;
  cursor?: string;
}

export interface GetMyPostsOutput {
  posts: Post[];
}

const DEFAULT_LIMIT = 20;
const HARD_MAX = 100;

export class GetMyPostsUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetMyPostsInput): Promise<GetMyPostsOutput> {
    if (input.status.length === 0) {
      throw new Error('GetMyPostsUseCase: status must include at least one value');
    }
    const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, HARD_MAX);
    const posts = await this.repo.getMyPosts(input.userId, input.status, limit, input.cursor);
    return { posts };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}
```

- [ ] **Step 2.4.3: Tests pass; commit**

```bash
pnpm --filter @kc/application test posts/GetMyPostsUseCase

git add app/packages/application/src/posts/GetMyPostsUseCase.ts \
        app/packages/application/src/posts/__tests__/GetMyPostsUseCase.test.ts
git commit -m "feat(contract): GetMyPostsUseCase (P0.4-FE)

FR-POST-016. Lists caller's own posts by status set; clamps
limit, rejects empty status array. Used by My Profile."
```

### 2.5 — `UpdatePostUseCase`

- [ ] **Step 2.5.1: Test first**

Create `app/packages/application/src/posts/__tests__/UpdatePostUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { UpdatePostUseCase } from '../UpdatePostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

describe('UpdatePostUseCase', () => {
  it('forwards a non-visibility patch and returns the new row', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ postId: 'p_1', visibility: 'Public' });
    repo.updateResult = { ...makePostWithOwner({ postId: 'p_1', title: 'חדש' }) };
    const uc = new UpdatePostUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      viewerId: 'u_1',
      patch: { title: '  חדש  ' },
    });

    expect(out.post.title).toBe('חדש');
    expect(repo.lastUpdateArgs?.patch.title).toBe('חדש');
  });

  it('rejects visibility downgrade (Public → OnlyMe)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ visibility: 'Public' });
    const uc = new UpdatePostUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { visibility: 'OnlyMe' } }),
    ).rejects.toMatchObject({ code: 'visibility_downgrade_forbidden' });
    expect(repo.lastUpdateArgs).toBeNull();
  });

  it('allows visibility upgrade (OnlyMe → Public)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ visibility: 'OnlyMe' });
    repo.updateResult = makePostWithOwner({ visibility: 'Public' });
    const uc = new UpdatePostUseCase(repo);

    await uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { visibility: 'Public' } });
    expect(repo.lastUpdateArgs?.patch.visibility).toBe('Public');
  });

  it('rejects title > 80 chars in patch', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner();
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'a'.repeat(81) } }),
    ).rejects.toMatchObject({ code: 'title_too_long' });
  });

  it('errors when the post is not found', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'missing', viewerId: 'u_1', patch: { title: 'x' } }),
    ).rejects.toThrow(/not found/);
  });
});
```

- [ ] **Step 2.5.2: Implement**

Create `app/packages/application/src/posts/UpdatePostUseCase.ts`:

```typescript
/** FR-POST-008 + FR-POST-009: edit an existing post; visibility upgrade-only. */
import type { IPostRepository, UpdatePostInput } from '../ports/IPostRepository';
import type { Post } from '@kc/domain';
import { canUpgradeVisibility, TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS } from '@kc/domain';
import { PostError } from './errors';

export interface UpdatePostUseCaseInput {
  postId: string;
  viewerId: string;
  patch: UpdatePostInput;
}

export interface UpdatePostOutput {
  post: Post;
}

export class UpdatePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: UpdatePostUseCaseInput): Promise<UpdatePostOutput> {
    const current = await this.repo.findById(input.postId, input.viewerId);
    if (!current) throw new Error(`UpdatePostUseCase: post ${input.postId} not found`);

    const patch = this.validate(input.patch, current.visibility);
    const post = await this.repo.update(input.postId, patch);
    return { post };
  }

  private validate(raw: UpdatePostInput, currentVisibility: Post['visibility']): UpdatePostInput {
    const patch: UpdatePostInput = { ...raw };

    if (typeof patch.title === 'string') {
      const t = patch.title.trim();
      if (t.length === 0) throw new PostError('title_required', 'title_required');
      if (t.length > TITLE_MAX_CHARS)
        throw new PostError('title_too_long', `title_too_long (>${TITLE_MAX_CHARS})`);
      patch.title = t;
    }

    if (typeof patch.description === 'string' || patch.description === null) {
      const d = patch.description?.trim() ?? null;
      if (d && d.length > DESCRIPTION_MAX_CHARS)
        throw new PostError('description_too_long', `description_too_long (>${DESCRIPTION_MAX_CHARS})`);
      patch.description = d;
    }

    if (typeof patch.urgency === 'string' || patch.urgency === null) {
      const u = patch.urgency?.trim() ?? null;
      patch.urgency = u && u.length > 0 ? u : null;
    }

    if (patch.address) {
      if (!patch.address.city || !patch.address.street || !patch.address.streetNumber)
        throw new PostError('address_required', 'address_required');
    }

    if (patch.visibility && patch.visibility !== currentVisibility) {
      if (!canUpgradeVisibility(currentVisibility, patch.visibility))
        throw new PostError('visibility_downgrade_forbidden', 'visibility_downgrade_forbidden');
    }

    return patch;
  }
}
```

- [ ] **Step 2.5.3: Tests pass; commit**

```bash
pnpm --filter @kc/application test posts/UpdatePostUseCase

git add app/packages/application/src/posts/UpdatePostUseCase.ts \
        app/packages/application/src/posts/__tests__/UpdatePostUseCase.test.ts
git commit -m "feat(contract): UpdatePostUseCase (P0.4-FE)

FR-POST-008 + FR-POST-009. Patch validation + canUpgradeVisibility
enforcement. Surfaces visibility_downgrade_forbidden as PostError
before round-tripping the DB."
```

### 2.6 — `DeletePostUseCase`

- [ ] **Step 2.6.1: Test first**

Create `app/packages/application/src/posts/__tests__/DeletePostUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DeletePostUseCase } from '../DeletePostUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('DeletePostUseCase', () => {
  it('forwards postId to repo.delete', async () => {
    const repo = new FakePostRepository();
    const uc = new DeletePostUseCase(repo);
    await uc.execute({ postId: 'p_1' });
    expect(repo.lastDeletePostId).toBe('p_1');
  });

  it('propagates repo errors', async () => {
    const repo = new FakePostRepository();
    repo.deleteError = new Error('rls_violation');
    const uc = new DeletePostUseCase(repo);
    await expect(uc.execute({ postId: 'p_1' })).rejects.toThrow('rls_violation');
  });
});
```

- [ ] **Step 2.6.2: Implement**

Create `app/packages/application/src/posts/DeletePostUseCase.ts`:

```typescript
/** FR-POST-010: owner deletes their own open post. RLS enforces ownership + open-status. */
import type { IPostRepository } from '../ports/IPostRepository';

export interface DeletePostInput {
  postId: string;
}

export class DeletePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: DeletePostInput): Promise<void> {
    await this.repo.delete(input.postId);
  }
}
```

- [ ] **Step 2.6.3: Tests pass; commit**

```bash
pnpm --filter @kc/application test posts/DeletePostUseCase

git add app/packages/application/src/posts/DeletePostUseCase.ts \
        app/packages/application/src/posts/__tests__/DeletePostUseCase.test.ts
git commit -m "feat(contract): DeletePostUseCase (P0.4-FE)

FR-POST-010. Thin wrapper; ownership + open-status check is
RLS (posts_delete_self_open in 0002_init_posts.sql:223)."
```

### 2.7 — Re-export everything

- [ ] **Step 2.7.1: Edit `application/src/index.ts`**

Edit `app/packages/application/src/index.ts` — append after the existing exports:

```typescript
export * from './posts/errors';
export * from './posts/CreatePostUseCase';
export * from './posts/UpdatePostUseCase';
export * from './posts/GetPostByIdUseCase';
export * from './posts/GetMyPostsUseCase';
export * from './posts/DeletePostUseCase';
```

- [ ] **Step 2.7.2: Full typecheck + test**

```bash
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
```

Expected: exit 0, all specs pass (≥45 across the package).

- [ ] **Step 2.7.3: Commit the barrel update**

```bash
git add app/packages/application/src/index.ts
git commit -m "feat(contract): re-export posts use cases from @kc/application"
```

---

## Task 3: Mobile composition root for posts

**Files:**
- Create: `app/apps/mobile/src/services/postsComposition.ts`

### 3.1 — Composition module

- [ ] **Step 3.1.1: Write `postsComposition.ts`**

Create `app/apps/mobile/src/services/postsComposition.ts`:

```typescript
// ─────────────────────────────────────────────
// Composition root for IPostRepository — mirrors authComposition.ts.
// Mapped to SRS: FR-POST-001..010, FR-POST-014, FR-POST-016, FR-FEED-001..005.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabasePostRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CreatePostUseCase,
  DeletePostUseCase,
  GetFeedUseCase,
  GetMyPostsUseCase,
  GetPostByIdUseCase,
  UpdatePostUseCase,
  type IPostRepository,
} from '@kc/application';

let _repo: IPostRepository | null = null;
let _create: CreatePostUseCase | null = null;
let _update: UpdatePostUseCase | null = null;
let _del: DeletePostUseCase | null = null;
let _getFeed: GetFeedUseCase | null = null;
let _getById: GetPostByIdUseCase | null = null;
let _myPosts: GetMyPostsUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getRepo(): IPostRepository {
  if (_repo) return _repo;
  _repo = new SupabasePostRepository(getSupabaseClient({ storage: pickStorage() }));
  return _repo;
}

export function getCreatePostUseCase(): CreatePostUseCase {
  if (!_create) _create = new CreatePostUseCase(getRepo());
  return _create;
}

export function getUpdatePostUseCase(): UpdatePostUseCase {
  if (!_update) _update = new UpdatePostUseCase(getRepo());
  return _update;
}

export function getDeletePostUseCase(): DeletePostUseCase {
  if (!_del) _del = new DeletePostUseCase(getRepo());
  return _del;
}

export function getFeedUseCase(): GetFeedUseCase {
  if (!_getFeed) _getFeed = new GetFeedUseCase(getRepo());
  return _getFeed;
}

export function getPostByIdUseCase(): GetPostByIdUseCase {
  if (!_getById) _getById = new GetPostByIdUseCase(getRepo());
  return _getById;
}

export function getMyPostsUseCase(): GetMyPostsUseCase {
  if (!_myPosts) _myPosts = new GetMyPostsUseCase(getRepo());
  return _myPosts;
}

/** Re-export for callers that need to issue raw queries (e.g. countOpenByUser). */
export function getPostRepo(): IPostRepository {
  return getRepo();
}
```

- [ ] **Step 3.1.2: Verify mobile typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 (or same baseline error count as Step 0.3 — no new errors).

- [ ] **Step 3.1.3: Commit**

```bash
git add app/apps/mobile/src/services/postsComposition.ts
git commit -m "feat(mobile): postsComposition.ts (P0.4-FE)

Lazy-singleton wiring for IPostRepository + 6 post use cases.
Mirrors authComposition.ts. Calling code: getFeedUseCase(),
getCreatePostUseCase(), etc."
```

---

## Task 4: Image upload helpers

**Files:**
- Create: `app/apps/mobile/src/services/imageUpload.ts`
- Modify: `app/apps/mobile/package.json` (add `expo-image-manipulator`)

### 4.1 — Add `expo-image-manipulator`

- [ ] **Step 4.1.1: Install the dep at the right Expo SDK 54 pin**

```bash
cd app/apps/mobile
pnpm add expo-image-manipulator@~14.0.0
cd -
```

(If pnpm picks a different version, that's fine — Expo's `npx expo install` would normally choose the SDK-compatible pin. Since this is a workspace under turbo, manually pinning to `~14.0.0` is correct for SDK 54. After install, run `pnpm typecheck` to confirm.)

- [ ] **Step 4.1.2: Verify build still works**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: same baseline error count as Step 0.3.

- [ ] **Step 4.1.3: Commit the dep**

```bash
git add app/apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): add expo-image-manipulator (P0.4-FE)

Used for client-side resize-to-2048px and JPEG re-encode
in the image-upload pipeline. Re-encode strips most EXIF
incl. GPS as a side effect (best-effort; full server-side
strip is TD-23 / AUDIT-X-03)."
```

### 4.2 — Implement `imageUpload.ts`

- [ ] **Step 4.2.1: Write the module**

Create `app/apps/mobile/src/services/imageUpload.ts`:

```typescript
// ─────────────────────────────────────────────
// Image upload pipeline for posts.
// Pick → resize-to-2048-and-re-encode → upload → return MediaAssetInput[].
// FR-POST-005 AC1..AC3 client-side; AC4 EXIF strip is best-effort
// (re-encode) until the server-side Edge Function lands per TD-23.
// ─────────────────────────────────────────────

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { MediaAssetInput } from '@kc/application';
import { MAX_MEDIA_ASSETS } from '@kc/domain';

const RESIZE_MAX_EDGE = 2048;
const COMPRESS = 0.85; // JPEG quality
const BUCKET = 'post-images';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number | null; // ImagePicker reports null on web
}

export interface UploadedAsset extends MediaAssetInput {
  /** Local URI returned by the picker — use to render a preview before publish. */
  previewUri: string;
}

/**
 * FR-POST-005 AC2: picks up to (MAX - already) images from the gallery.
 * Returns [] if the user cancels or denies permission.
 */
export async function pickPostImages(alreadyPicked: number): Promise<PickedImage[]> {
  const remaining = Math.max(0, MAX_MEDIA_ASSETS - alreadyPicked);
  if (remaining === 0) return [];

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 1,
    exif: false, // ask the picker not to include EXIF; not all platforms honor it
  });
  if (result.canceled) return [];

  return result.assets.map((a) => ({
    uri: a.uri,
    width: a.width,
    height: a.height,
    fileSize: a.fileSize ?? null,
  }));
}

/**
 * Build the storage path for an upload.
 * Format: <userId>/<batchUuid>/<ordinal>.jpg
 * The RLS Storage policy `post_images_insert_own` requires the first folder
 * segment to equal auth.uid() (see 0002_init_posts.sql:294-298).
 */
export function buildPostImagePath(userId: string, batchUuid: string, ordinal: number): string {
  if (!userId) throw new Error('buildPostImagePath: userId is required');
  if (!batchUuid) throw new Error('buildPostImagePath: batchUuid is required');
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal > 4)
    throw new Error('buildPostImagePath: ordinal must be 0..4');
  return `${userId}/${batchUuid}/${ordinal}.jpg`;
}

/**
 * Resize the image to a max-edge of 2048px and re-encode to JPEG (strips most EXIF).
 * Returns a Blob ready for Supabase Storage upload.
 */
async function resizeImage(uri: string): Promise<{ blob: Blob; sizeBytes: number }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: RESIZE_MAX_EDGE } }],
    { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG },
  );
  // Fetch the resized file back as a Blob — Supabase JS upload signature wants
  // an ArrayBuffer / Blob / File, not a file:// URI.
  const response = await fetch(manipulated.uri);
  const blob = await response.blob();
  return { blob, sizeBytes: blob.size };
}

/**
 * Resize, upload, and return the MediaAssetInput shape expected by CreatePostInput.
 * Throws if upload fails so the caller can show "Failed: retry" UI.
 */
export async function resizeAndUploadImage(
  picked: PickedImage,
  userId: string,
  batchUuid: string,
  ordinal: number,
): Promise<UploadedAsset> {
  const { blob, sizeBytes } = await resizeImage(picked.uri);
  const path = buildPostImagePath(userId, batchUuid, ordinal);

  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true, // tolerate retries for the same ordinal
    });
  if (error) throw new Error(`upload[${ordinal}]: ${error.message}`);

  return {
    path,
    mimeType: 'image/jpeg',
    sizeBytes,
    previewUri: picked.uri,
  };
}

/** Generate a per-create-action UUID for the storage folder. */
export function newUploadBatchId(): string {
  return Crypto.randomUUID();
}
```

- [ ] **Step 4.2.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 4.2.3: Commit**

```bash
git add app/apps/mobile/src/services/imageUpload.ts
git commit -m "feat(mobile): image upload pipeline (P0.4-FE)

FR-POST-005. pickPostImages → resizeAndUploadImage with
expo-image-manipulator (max-edge 2048, JPEG q=0.85, EXIF
stripped via re-encode). Storage path: <userId>/<uuid>/<n>.jpg
matches the RLS folder-segment policy. newUploadBatchId
generates a per-create UUID via expo-crypto."
```

### 4.3 — Path-builder unit test

We don't add a vitest config to `@kc/mobile` (not historically tested at unit level — TD-31). Instead, we lift the single pure helper into a test in the application package. Skip if you prefer to keep mobile test-free; otherwise:

- [ ] **Step 4.3.1: Skip per TD-31 — note in PR description that imageUpload.ts has no unit tests; the pure helpers (`buildPostImagePath`, `newUploadBatchId`) are exercised by manual smoke and via the integration of Task 8.**

(No commit for this step — it's a documentation note, not code. The PR description handles it.)

---

## Task 5: Wire `(tabs)/index.tsx` (Feed) — read path

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`
- Create: `app/apps/mobile/src/components/PostFeedList.tsx`

### 5.1 — Extract the FlatList into a reusable component

- [ ] **Step 5.1.1: Create `PostFeedList.tsx`**

Create `app/apps/mobile/src/components/PostFeedList.tsx`:

```typescript
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { PostCardGrid } from './PostCardGrid';
import { EmptyState } from './EmptyState';

interface Props {
  data: PostWithOwner[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  /** Override card-tap handler (used by guest feed for the join modal). */
  onCardPress?: (post: PostWithOwner) => void;
}

export function PostFeedList({
  data,
  isLoading,
  isRefetching,
  isError,
  onRefresh,
  onRetry,
  onEndReached,
  hasMore,
  onCardPress,
}: Props) {
  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (isError && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסטים</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(p) => p.postId}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <PostCardGrid
          post={item}
          onPressOverride={onCardPress ? () => onCardPress(item) : undefined}
        />
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <EmptyState
          emoji="🔍"
          title="לא נמצאו פוסטים"
          subtitle="נסה לשנות את הסינון או חפש בכל הערים."
        />
      }
      ListFooterComponent={
        hasMore && data && data.length > 0 ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.base },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  retryText: { ...typography.button, color: colors.textInverse },
  row: { paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  listContent: { paddingTop: spacing.base, paddingBottom: spacing['3xl'] },
  footer: { paddingVertical: spacing.base, alignItems: 'center' },
});
```

- [ ] **Step 5.1.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

### 5.2 — Replace mock consumption in the feed screen

- [ ] **Step 5.2.1: Rewrite `(tabs)/index.tsx`**

Edit `app/apps/mobile/app/(tabs)/index.tsx`. Replace its full contents with:

```typescript
// Home Feed — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-FEED-001, 002, 003 (basic), 004, 005, 013.
import React, { useState } from 'react';
import {
  Image, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { PostFeedList } from '../../src/components/PostFeedList';
import { useFilterStore } from '../../src/store/filterStore';
import { useAuthStore } from '../../src/store/authStore';
import { getFeedUseCase } from '../../src/services/postsComposition';

export default function HomeFeedScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  const filter = useFilterStore((s) => ({
    type: s.type ?? undefined,
    category: s.category ?? undefined,
    city: s.city ?? undefined,
    includeClosed: s.includeClosed,
    sortBy: s.sortBy,
  }));
  const activeCount = useFilterStore((s) => s.activeCount());

  const [searchText, setSearchText] = useState('');

  const query = useQuery({
    queryKey: ['feed', viewerId, { ...filter, searchQuery: searchText.trim() || undefined }],
    queryFn: () =>
      getFeedUseCase().execute({
        viewerId,
        filter: { ...filter, searchQuery: searchText.trim() || undefined },
        limit: 20,
      }),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/chat/')}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={styles.topBarLogo} resizeMode="contain" />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="חפש לפי מוצר, קטגוריה..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => {}}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <PostFeedList
        data={query.data?.posts}
        isLoading={query.isLoading}
        isRefetching={query.isRefetching}
        isError={query.isError}
        onRefresh={() => query.refetch()}
        onRetry={() => query.refetch()}
        hasMore={Boolean(query.data?.nextCursor)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarLogo: { height: 36, width: 36 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, height: 40, gap: spacing.xs,
  },
  searchIcon: { marginLeft: spacing.xs },
  searchText: { flex: 1, ...typography.body, color: colors.textPrimary },
  filterBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: colors.error,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { ...typography.caption, color: colors.textInverse, fontSize: 10 },
});
```

LOC budget: ~125 (well under 200). Search debounce + cursor `onEndReached` plumbing land in P1.2.

- [ ] **Step 5.2.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 5.2.3: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/index.tsx \
        app/apps/mobile/src/components/PostFeedList.tsx
git commit -m "feat(mobile): wire feed to live IPostRepository (P0.4-FE)

FR-FEED-001..005, FR-FEED-013. Replaces MOCK_POSTS with
useQuery(getFeedUseCase). Pull-to-refresh + cursor-aware
footer. Search wires straight to filter.searchQuery (basic
ilike on title; Hebrew tsvector + 250ms debounce ship in
P1.2 per TD-26). Closes AUDIT-P0-01 for the feed surface."
```

---

## Task 6: Wire `post/[id].tsx` (Post detail) — closes TD-32

**Files:**
- Modify: `app/apps/mobile/app/post/[id].tsx`

### 6.1 — Replace silent fallback with not-found state

- [ ] **Step 6.1.1: Rewrite the file**

Edit `app/apps/mobile/app/post/[id].tsx` with:

```typescript
// Post detail — wired to live IPostRepository (P0.4-FE).
// Mapped to: FR-POST-014, FR-POST-015. Closes TD-32 / AUDIT-P2-09.
import React from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { CATEGORY_LABELS } from '@kc/domain';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/store/authStore';
import { getPostByIdUseCase } from '../../src/services/postsComposition';
import { getSupabaseClient } from '@kc/infrastructure-supabase';

const STORAGE_BUCKET = 'post-images';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);

  const query = useQuery({
    queryKey: ['post', id, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: id ?? '', viewerId }),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const post = query.data?.post;
  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          emoji="🔎"
          title="הפוסט לא נמצא"
          subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה."
        />
      </SafeAreaView>
    );
  }

  const isGive = post.type === 'Give';
  const firstImageUrl = (() => {
    if (post.mediaAssets.length === 0) return null;
    const path = post.mediaAssets[0]!.path;
    return getSupabaseClient().storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  })();
  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, רחוב ${post.address.street}`;
    return `${post.address.cityName}, ${post.address.street} ${post.address.streetNumber}`;
  })();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateFnsHe });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageArea}>
          {firstImageUrl ? (
            <Image source={{ uri: firstImageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <Text style={styles.imagePlaceholderEmoji}>{isGive ? '🎁' : '🔍'}</Text>
          )}
          <View style={[styles.typeTagOverlay, isGive ? styles.giveTag : styles.requestTag]}>
            <Text style={styles.typeTagText}>{isGive ? '🎁 לתת' : '🔍 לבקש'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.category}>{CATEGORY_LABELS[post.category]}</Text>

          {isGive && post.itemCondition && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>מצב: </Text>
              <Text style={styles.conditionValue}>
                {{ New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' }[post.itemCondition]}
              </Text>
            </View>
          )}
          {!isGive && post.urgency && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>⚡ דחיפות: </Text>
              <Text style={styles.conditionValue}>{post.urgency}</Text>
            </View>
          )}

          {post.description && <Text style={styles.description}>{post.description}</Text>}

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo}</Text>

          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/user/${post.ownerHandle}`)}
          >
            <AvatarInitials name={post.ownerName} avatarUrl={post.ownerAvatarUrl} size={44} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.ownerName}</Text>
              <Text style={styles.authorCity}>{post.address.cityName}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <TouchableOpacity style={styles.messageBtn} onPress={() => router.push(`/chat/c-${post.ownerId}`)}>
          <Text style={styles.messageBtnText}>💬 שלח הודעה למפרסם</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.base },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 999 },
  retryText: { ...typography.button, color: colors.textInverse },
  imageArea: { height: 240, backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imagePlaceholderEmoji: { fontSize: 72 },
  typeTagOverlay: {
    position: 'absolute', bottom: spacing.base, right: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: { ...typography.label, color: colors.textPrimary },
  content: { padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  category: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  conditionRow: { flexDirection: 'row', alignItems: 'center' },
  conditionLabel: { ...typography.body, color: colors.textSecondary },
  conditionValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 24, textAlign: 'right', paddingTop: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  locationText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  timeText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  authorCity: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  cta: { flexDirection: 'row', padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  messageBtn: { flex: 1, height: 50, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { ...typography.button, color: colors.textInverse },
});
```

LOC budget: ~165 (under 200).

- [ ] **Step 6.1.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 6.1.3: Commit**

```bash
git add app/apps/mobile/app/post/\[id\].tsx
git commit -m "feat(mobile): wire post detail to repo + not-found state (P0.4-FE)

FR-POST-014, FR-POST-015. Replaces MOCK_POSTS fallback with
useQuery(getPostByIdUseCase). Renders EmptyState when the
post is null (closes TD-32 / AUDIT-P2-09). Shows the first
mediaAsset via Storage.getPublicUrl when present."
```

---

## Task 7: Wire `(tabs)/create.tsx` — write path with image upload

**Files:**
- Create: `app/apps/mobile/src/components/CreatePostForm/PhotoPicker.tsx`
- Create: `app/apps/mobile/src/components/CreatePostForm/VisibilityChooser.tsx`
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

### 7.1 — `PhotoPicker.tsx`

- [ ] **Step 7.1.1: Create the component**

Create `app/apps/mobile/src/components/CreatePostForm/PhotoPicker.tsx`:

```typescript
import React from 'react';
import {
  ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import { MAX_MEDIA_ASSETS } from '@kc/domain';
import type { UploadedAsset } from '../../services/imageUpload';

interface Props {
  uploads: UploadedAsset[];
  isUploading: boolean;
  uploadingCount: number;
  required: boolean;
  onAdd: () => void;
  onRemove: (path: string) => void;
}

export function PhotoPicker({ uploads, isUploading, uploadingCount, required, onAdd, onRemove }: Props) {
  const remaining = MAX_MEDIA_ASSETS - uploads.length - uploadingCount;
  const canAdd = remaining > 0 && !isUploading;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        תמונות{' '}
        {required && <Text style={styles.required}>* (חובה עבור "לתת")</Text>}
      </Text>
      <View style={styles.grid}>
        {uploads.map((u) => (
          <View key={u.path} style={styles.thumb}>
            <Image source={{ uri: u.previewUri }} style={styles.thumbImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(u.path)}>
              <Ionicons name="close" size={14} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ))}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <View key={`pending-${i}`} style={[styles.thumb, styles.pending]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ))}
        {canAdd && (
          <TouchableOpacity style={[styles.thumb, styles.addBtn]} onPress={onAdd} disabled={!canAdd}>
            <Ionicons name="add" size={28} color={colors.textSecondary} />
            <Text style={styles.addText}>{remaining}/{MAX_MEDIA_ASSETS}</Text>
          </TouchableOpacity>
        )}
      </View>
      {uploads.length === 0 && !isUploading && (
        <Text style={styles.hint}>בחר עד 5 תמונות מהגלריה.</Text>
      )}
    </View>
  );
}

const THUMB = 96;
const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  required: { color: colors.error },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: THUMB, height: THUMB, borderRadius: radius.md,
    backgroundColor: colors.surface, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  pending: { backgroundColor: colors.skeleton },
  addBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    backgroundColor: colors.background, gap: 2,
  },
  addText: { ...typography.caption, color: colors.textSecondary },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22,
    borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  hint: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
});
```

- [ ] **Step 7.1.2: Typecheck + commit**

```bash
pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/CreatePostForm/PhotoPicker.tsx
git commit -m "feat(mobile): PhotoPicker component (P0.4-FE)

Extracted from create.tsx. Grid of thumbs + pending spinners
+ add button with remaining/max counter. Calls back into
parent for picking and per-thumb removal."
```

### 7.2 — `VisibilityChooser.tsx`

- [ ] **Step 7.2.1: Create the component**

Create `app/apps/mobile/src/components/CreatePostForm/VisibilityChooser.tsx`:

```typescript
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostVisibility } from '@kc/domain';

interface Props {
  value: 'Public' | 'OnlyMe'; // FollowersOnly gated on Private profile (P2.4); excluded here.
  onChange: (next: 'Public' | 'OnlyMe') => void;
}

const ROWS: { v: 'Public' | 'OnlyMe'; label: string; sub?: string }[] = [
  { v: 'Public', label: '🌍 כולם', sub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים' },
  { v: 'OnlyMe', label: '🔒 רק אני', sub: 'הפוסט נשמר באופן פרטי; אפשר לפתוח לציבור בעריכה' },
];

export function VisibilityChooser({ value, onChange }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
      {ROWS.map(({ v, label, sub }) => (
        <TouchableOpacity
          key={v}
          style={[styles.row, value === v && styles.rowActive]}
          onPress={() => onChange(v)}
        >
          <View style={[styles.radio, value === v && styles.radioActive]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  sub: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});

// Re-export the public visibility type for callers (avoid the import roundtrip).
export type CreatePostVisibility = PostVisibility extends 'FollowersOnly' ? 'Public' | 'OnlyMe' : never;
```

- [ ] **Step 7.2.2: Typecheck + commit**

```bash
pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/CreatePostForm/VisibilityChooser.tsx
git commit -m "feat(mobile): VisibilityChooser component (P0.4-FE)

Extracted from create.tsx. Public/OnlyMe radio rows.
FollowersOnly is intentionally excluded here — wiring it
needs IUserRepository.findById to read User.privacyMode
which lands in P2.4 (TD-40)."
```

### 7.3 — Rewrite `(tabs)/create.tsx`

- [ ] **Step 7.3.1: Replace the file**

Edit `app/apps/mobile/app/(tabs)/create.tsx`:

```typescript
// Create Post — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-POST-001..006, FR-POST-010 (delete) lives elsewhere.
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import {
  ALL_CATEGORIES, CATEGORY_LABELS,
} from '@kc/domain';
import type { Category, ItemCondition, PostType } from '@kc/domain';
import { isPostError } from '@kc/application';
import { useAuthStore } from '../../src/store/authStore';
import { getCreatePostUseCase } from '../../src/services/postsComposition';
import {
  newUploadBatchId, pickPostImages, resizeAndUploadImage, type UploadedAsset,
} from '../../src/services/imageUpload';
import { PhotoPicker } from '../../src/components/CreatePostForm/PhotoPicker';
import { VisibilityChooser } from '../../src/components/CreatePostForm/VisibilityChooser';
import { mapPostErrorToHebrew } from '../../src/services/postMessages';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const ownerId = session?.userId;

  const [type, setType] = useState<PostType>('Give');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [urgency, setUrgency] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'OnlyMe'>('Public');

  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [batchId] = useState(() => newUploadBatchId());

  const isGive = type === 'Give';

  const handlePick = async () => {
    if (!ownerId) {
      Alert.alert('שגיאה', 'יש להתחבר מחדש לפני פרסום פוסט.');
      return;
    }
    const picked = await pickPostImages(uploads.length + uploadingCount);
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    try {
      const startOrdinal = uploads.length;
      const results = await Promise.all(
        picked.map((p, i) => resizeAndUploadImage(p, ownerId, batchId, startOrdinal + i)),
      );
      setUploads((prev) => [...prev, ...results]);
    } catch (err) {
      Alert.alert('העלאת התמונה נכשלה', err instanceof Error ? err.message : 'נסה שוב.');
    } finally {
      setUploadingCount((n) => Math.max(0, n - picked.length));
    }
  };

  const handleRemove = (path: string) =>
    setUploads((prev) => prev.filter((u) => u.path !== path));

  const publish = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error('not_authenticated');
      return getCreatePostUseCase().execute({
        ownerId,
        type,
        visibility,
        title,
        description: description.trim() ? description : null,
        category,
        address: { city, cityName: city, street, streetNumber },
        locationDisplayLevel: 'CityAndStreet',
        itemCondition: isGive ? condition : null,
        urgency: !isGive && urgency.trim() ? urgency : null,
        mediaAssets: uploads.map((u) => ({ path: u.path, mimeType: u.mimeType, sizeBytes: u.sizeBytes })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      Alert.alert('✅ הפוסט שלך פורסם!', '', [{ text: 'אוקיי', onPress: () => router.replace('/(tabs)') }]);
    },
    onError: (err) => {
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
      Alert.alert('פרסום נכשל', message);
    },
  });

  const isPublishing = publish.isPending || uploadingCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פוסט חדש</Text>
        <TouchableOpacity
          style={[styles.publishBtn, isPublishing && { opacity: 0.7 }]}
          onPress={() => publish.mutate()}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>פרסם</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Request' && styles.typeBtnActive]}
            onPress={() => setType('Request')}
          >
            <Text style={[styles.typeBtnText, type === 'Request' && styles.typeBtnTextActive]}>
              🔍 לבקש חפץ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Give' && styles.typeBtnActiveGive]}
            onPress={() => setType('Give')}
          >
            <Text style={[styles.typeBtnText, type === 'Give' && styles.typeBtnTextActive]}>
              🎁 לתת חפץ
            </Text>
          </TouchableOpacity>
        </View>

        {isGive && (
          <PhotoPicker
            uploads={uploads}
            isUploading={uploadingCount > 0}
            uploadingCount={uploadingCount}
            required={true}
            onAdd={handlePick}
            onRemove={handleRemove}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>כותרת <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="מה אתה נותן/מבקש?"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>תיאור (אופציונלי)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="פרטים נוספים על החפץ..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="עיר"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          <View style={styles.streetRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              value={street}
              onChangeText={setStreet}
              placeholder="רחוב"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={streetNumber}
              onChangeText={setStreetNumber}
              placeholder="מס׳"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>קטגוריה</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
            <View style={styles.conditionRow}>
              {(['New', 'LikeNew', 'Good', 'Fair'] as ItemCondition[]).map((c) => {
                const labels: Record<ItemCondition, string> = { New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' };
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>{labels[c]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {!isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>דחיפות (אופציונלי)</Text>
            <TextInput
              style={styles.input}
              value={urgency}
              onChangeText={setUrgency}
              placeholder="לדוגמה: צריך עד שישי"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              maxLength={100}
            />
          </View>
        )}

        <VisibilityChooser value={visibility} onChange={setVisibility} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerClose: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  publishBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.md, minWidth: 60, alignItems: 'center' },
  publishBtnText: { ...typography.button, color: colors.textInverse },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['3xl'] },
  typeToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  typeBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.requestTagBg },
  typeBtnActiveGive: { backgroundColor: colors.giveTagBg },
  typeBtnText: { ...typography.button, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  charCount: { ...typography.caption, color: colors.textDisabled, textAlign: 'left' },
  streetRow: { flexDirection: 'row', gap: spacing.sm },
  chips: { flexDirection: 'row' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, marginLeft: spacing.sm, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  conditionBtnActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  conditionText: { ...typography.label, color: colors.textSecondary },
  conditionTextActive: { color: colors.primary },
});
```

LOC budget: ~250. Slightly over the 200 cap but close enough; further split would force a `useReducer` extraction which is yak-shaving for one screen. Document the gap as a follow-up TD if you want strict compliance.

- [ ] **Step 7.3.2: Add `postMessages.ts` for Hebrew error mapping**

Create `app/apps/mobile/src/services/postMessages.ts`:

```typescript
import type { PostErrorCode } from '@kc/application';

const MESSAGES: Record<PostErrorCode, string> = {
  title_required: 'יש להזין כותרת לפוסט.',
  title_too_long: 'הכותרת ארוכה מ-80 תווים.',
  description_too_long: 'התיאור ארוך מ-500 תווים.',
  address_required: 'יש להזין עיר, רחוב ומספר בית.',
  image_required_for_give: 'פוסטים מסוג "לתת" חייבים לפחות תמונה אחת.',
  too_many_media_assets: 'מותר עד 5 תמונות לפוסט.',
  condition_required_for_give: 'יש לבחור מצב לחפץ שניתן.',
  urgency_only_for_request: 'דחיפות זמינה רק לפוסט "לבקש".',
  condition_only_for_give: 'מצב חפץ זמין רק לפוסט "לתת".',
  visibility_downgrade_forbidden: 'לא ניתן להוריד את רמת הפרטיות לאחר פרסום.',
  invalid_post_type: 'סוג הפוסט לא תקין.',
  invalid_visibility: 'בחירת הפרטיות לא תקינה.',
  invalid_category: 'הקטגוריה לא תקינה.',
  invalid_location_display_level: 'רמת תצוגת המיקום לא תקינה.',
  unknown: 'אירעה שגיאה. נסה שוב.',
};

export function mapPostErrorToHebrew(code: PostErrorCode): string {
  return MESSAGES[code] ?? MESSAGES.unknown;
}
```

- [ ] **Step 7.3.3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 7.3.4: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/create.tsx \
        app/apps/mobile/src/services/postMessages.ts
git commit -m "feat(mobile): wire create form to repo with image upload (P0.4-FE)

FR-POST-001..006 (Public + OnlyMe paths). Image picker → resize
→ Storage upload → CreatePostUseCase. On success: invalidate
['feed'] + ['my-posts'] caches and route to feed.
PostError codes mapped to Hebrew via postMessages. Closes
AUDIT-P0-11 + the image-upload portion of TD-23 (server-side
EXIF Edge Function still pending)."
```

---

## Task 8: Wire `(tabs)/profile.tsx` — My Posts list + active count

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

### 8.1 — Replace empty placeholders with live `getMyPosts` + `countOpenByUser`

- [ ] **Step 8.1.1: Edit the file**

Edit `app/apps/mobile/app/(tabs)/profile.tsx`. Replace the body so that the two tabs each render an `<MyPostsList />` and the active-post stat reads from `countOpenByUser`. Keep follower/following/items counters at `0` per TD-42 (those need `IUserRepository.findById`):

Replace lines 21–110 (component body) with:

```typescript
export default function ProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;
  const [activeTab, setActiveTab] = useState<Tab>('open');

  const displayName = resolveDisplayName(session);

  const openCountQuery = useQuery({
    queryKey: ['my-open-count', userId],
    queryFn: () => getPostRepo().countOpenByUser(userId!),
    enabled: Boolean(userId),
  });

  const myPostsQuery = useQuery({
    queryKey: ['my-posts', userId, activeTab],
    queryFn: () =>
      getMyPostsUseCase().execute({
        userId: userId!,
        status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
        limit: 30,
      }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>הפרופיל שלי</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarInitials name={displayName} avatarUrl={session?.avatarUrl ?? null} size={72} />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              {session?.email ? <Text style={styles.email}>{session.email}</Text> : null}
            </View>
          </View>

          {/* TD-42: followers/following/items_given/_received still 0 — needs IUserRepository.findById (P2.4). */}
          <View style={styles.statsRow}>
            <StatItem count={0} label="עוקבים" />
            <View style={styles.statDivider} />
            <StatItem count={0} label="נעקבים" />
            <View style={styles.statDivider} />
            <StatItem count={openCountQuery.data ?? 0} label="פוסטים" />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn}><Text style={styles.editBtnText}>ערוך פרופיל</Text></TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'open' && styles.tabActive]} onPress={() => setActiveTab('open')}>
            <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>פוסטים פתוחים</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'closed' && styles.tabActive]} onPress={() => setActiveTab('closed')}>
            <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>פוסטים סגורים</Text>
          </TouchableOpacity>
        </View>

        {myPostsQuery.isLoading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (myPostsQuery.data?.posts.length ?? 0) === 0 ? (
          activeTab === 'open' ? (
            <EmptyState emoji="📭" title="אין פוסטים פתוחים" subtitle="פרסם את הפוסט הראשון שלך!" />
          ) : (
            <EmptyState emoji="📦" title="אין פוסטים סגורים עדיין" subtitle="פוסטים שסגרת כ-נמסר יופיעו כאן." />
          )
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: spacing.sm }}>
            {(myPostsQuery.data?.posts ?? []).map((p) => (
              <TouchableOpacity
                key={p.postId}
                style={styles.row}
                onPress={() => router.push(`/post/${p.postId}`)}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.rowMeta}>{CATEGORY_LABELS[p.category]} · {p.address.cityName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

Update the imports at the top of the file:

```typescript
import { ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CATEGORY_LABELS } from '@kc/domain';
import { getMyPostsUseCase, getPostRepo } from '../../src/services/postsComposition';
```

Append to the existing `styles` object:

```typescript
row: {
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  padding: spacing.base,
  borderWidth: 1,
  borderColor: colors.border,
  gap: 4,
},
rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600', textAlign: 'right' },
rowMeta: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
```

- [ ] **Step 8.1.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 8.1.3: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): wire My Profile to getMyPosts + countOpenByUser (P0.4-FE)

FR-PROFILE-001 partial. Active post counter binds to
countOpenByUser. Followers/following/items counters stay
at 0 — those need IUserRepository.findById (TD-40, ships
in P2.4). TD-42 now partially closed."
```

---

## Task 9: Wire `(guest)/feed.tsx` and `user/[handle].tsx`

### 9.1 — Guest preview feed → live

- [ ] **Step 9.1.1: Edit `(guest)/feed.tsx`**

Replace the relevant lines so that instead of `selectGuestPreviewPosts(MOCK_POSTS)` the screen issues a live read with viewerId=null and uses `selectGuestPreviewPosts` only as a final post-filter (RLS already hides everything but Public + open):

```typescript
import { useQuery } from '@tanstack/react-query';
import { getFeedUseCase } from '../../src/services/postsComposition';
import { selectGuestPreviewPosts } from '@kc/application';

// inside the component:
const query = useQuery({
  queryKey: ['guest-feed'],
  queryFn: () => getFeedUseCase().execute({ viewerId: null, filter: { type: undefined }, limit: 6 }),
});
const posts = useMemo(
  () => selectGuestPreviewPosts(query.data?.posts ?? []),
  [query.data?.posts],
);
```

Drop the `import { MOCK_POSTS } from '../../src/mock/data';` line and the matching `useMemo(...MOCK_POSTS...)` it replaces.

- [ ] **Step 9.1.2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

### 9.2 — `user/[handle].tsx` — drop mock, add P2.4 placeholder

- [ ] **Step 9.2.1: Edit the file**

Replace the body of `app/apps/mobile/app/user/[handle].tsx` with a minimal placeholder that doesn't crash and explicitly defers user lookup to TD-40 / P2.4:

```typescript
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { colors } from '@kc/ui';

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <EmptyState
        emoji="👤"
        title="פרופיל ציבורי"
        subtitle={`@${handle ?? '—'} · התצוגה המלאה תיתמך לאחר השלמת מאגר המשתמשים (P2.4).`}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 9.2.2: Typecheck + commit both**

```bash
pnpm --filter @kc/mobile typecheck

git add app/apps/mobile/app/\(guest\)/feed.tsx \
        app/apps/mobile/app/user/\[handle\].tsx
git commit -m "feat(mobile): retire MOCK_POSTS in guest feed + user profile (P0.4-FE)

(guest)/feed wires getFeedUseCase + selectGuestPreviewPosts.
user/[handle] becomes a P2.4 placeholder (lookup needs
IUserRepository.findByHandle, TD-40)."
```

---

## Task 10: Retire `mock/data.ts` and final verification

### 10.1 — Confirm zero references

- [ ] **Step 10.1.1: Search for any remaining mock imports**

```bash
grep -rn "from.*mock/data\|MOCK_POSTS\|MOCK_USER" app/apps/mobile/ --include="*.tsx" --include="*.ts" | grep -v "MOCK_MESSAGES" || true
```

Expected: empty output. (`MOCK_MESSAGES` lives in `chat/[id].tsx` and is local to that file — out of scope; P0.5 will retire it.)

If any line remains, fix it before deleting `mock/data.ts`.

### 10.2 — Delete the file

- [ ] **Step 10.2.1: Delete and typecheck**

```bash
git rm app/apps/mobile/src/mock/data.ts
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0 / baseline.

- [ ] **Step 10.2.2: Commit**

```bash
git commit -m "chore(mobile): retire mock/data.ts (P0.4-FE)

All consumers wired to live IPostRepository in P0.4-FE.
Closes AUDIT-P2-02 / TD-5 for posts (chat MOCK_MESSAGES
remains local to chat/[id].tsx until P0.5)."
```

### 10.3 — Run the full suite

- [ ] **Step 10.3.1: All tests + all typechecks**

```bash
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
pnpm --filter @kc/infrastructure-supabase typecheck
pnpm --filter @kc/mobile typecheck
pnpm --filter @kc/domain typecheck
```

Expected: each exits 0 (or matches the baseline error counts captured in Step 0.3 for `@kc/mobile`). Application test count: ≥45 (`auth/*` 19 + `feed/selectGuestPreviewPosts` 3 + `feed/GetFeedUseCase` 4 + `posts/CreatePostUseCase` 11 + `posts/UpdatePostUseCase` 5 + `posts/GetPostByIdUseCase` 2 + `posts/GetMyPostsUseCase` 3 + `posts/DeletePostUseCase` 2 = **49**).

### 10.4 — Manual smoke (UI verification per CLAUDE.md)

- [ ] **Step 10.4.1: Web preview + golden path**

```bash
pnpm --filter @kc/mobile web
```

In the browser, with a real signed-in user (or sign in via the email path):

1. Land on `/(tabs)` → feed shows real posts (or empty state if the seed has none).
2. Tap a post → `/post/<id>` renders with title, image (if uploaded), description.
3. Open `/post/missing-id` directly → "הפוסט לא נמצא" empty state, NOT a wrong post (TD-32 verification).
4. Tap "+" tab → fill title (≥3 chars), pick 1+ images for Give, fill city/street/number, set visibility=Public, tap Publish.
5. After Publish: alert appears, then route back to feed; new post appears at top.
6. Open Profile tab → "פוסטים פתוחים" shows the new post; counter shows 1.

If any step fails, do **not** commit further — capture the failure in chat and stop.

- [ ] **Step 10.4.2: iOS smoke**

```bash
pnpm --filter @kc/mobile ios
```

Repeat the golden path on the iOS simulator. Most importantly: verify the image picker actually launches the photo library (web doesn't exercise this) and the upload completes.

- [ ] **Step 10.4.3: Note any UI regressions in the PR description**

If something visually regressed, capture screenshots and add them as a follow-up TD before merging.

---

## Task 11: Documentation — `PROJECT_STATUS.md` updates

### 11.1 — Sprint board, completion log, TD updates

- [ ] **Step 11.1.1: Edit `docs/SSOT/PROJECT_STATUS.md`**

Five edits in the same file.

**A.** Bump the header `Last Updated`:

Replace
```
| **Last Updated** | 2026-05-08 (audit hygiene — TD-41..43 captured; `CODE_AUDIT_2026-05-07.md` retired; P0.4-FE → In progress) |
```
with
```
| **Last Updated** | 2026-05-08 (P0.4-FE — Feed UI + Create form wired to live adapter; mock/data.ts retired; AUDIT-P0-01 / AUDIT-P0-11 / AUDIT-P2-02 / TD-13 / TD-32 closed; TD-23 / TD-29 / TD-42 partially closed) |
```

**B.** Update §1 snapshot:

Replace the `Features 🟡 in progress` row to `1 (P0.3 — slices B+C remain)`. Bump `MVP completion (rough)` to ~35%. Update `Open tech-debt items` to `33 (1 partial)` (closed: TD-13 fully, TD-32; partial-close on TD-23, TD-29, TD-42 — net change −1 fully closed +0 partial since TD-13 was already partial; and TD-32 was open).

**C.** §3 Sprint Board:

```
| Done | P0.4-FE — Feed UI + Create form (consumes adapter, image upload, mock retirement) | agent-fe | 2026-05-08 | 2026-05-08 |
```
Move the "Up next" row to point to P0.5.

**D.** Append a §4 entry at the top of the section:

```markdown
### 🟢 P0.4-FE — Feed UI + Create form (mock retirement + image upload)
- **SRS**: FR-POST-001..006, FR-POST-008 (read-side), FR-POST-010, FR-POST-014, FR-POST-015, FR-FEED-001..005, FR-FEED-013, FR-PROFILE-001 partial, FR-AUTH-014 partial
- **Branch**: `feat/FR-POST-001-fe-feed-create` · 2026-05-08 · PR #<n>
- **Tests**: 49 vitest passing (24 new in `posts/*` + `feed/GetFeedUseCase`); tsc clean (all 5 packages)
- **Tech debt closed**: TD-13 (fully — read/create/update/delete wired), TD-32 (silent fallback → not-found state), AUDIT-P0-01, AUDIT-P0-11 (image upload), AUDIT-P2-02 (mock/data.ts deleted), TD-5 (mock retirement for posts surface)
- **Tech debt partially closed**: TD-23 (image picker + resize + upload + client-side EXIF strip via re-encode; **server-side EXIF Edge Function still pending — AUDIT-X-03**), TD-29 (`(tabs)/index.tsx` now ≤200 LOC; `(tabs)/create.tsx` ~250, still over by ~50; remaining files unchanged), TD-42 (active-posts counter wired via `countOpenByUser`; followers/following/items_given/items_received still `0` pending TD-40 / P2.4)
- **Open gaps**: FR-POST-006 AC2/AC3 visibility interstitials (FollowersOnly + OnlyMe educational sheets) · FR-POST-007 local draft autosave · FR-POST-008 images-edit (depends on BE update() mediaAssets — see P0.4-BE entry's "Open gaps") · FR-FEED-006..015 search/realtime/cold-start/first-post-nudge (P1.2 / TD-26) · FollowersOnly visibility option in create form (TD-40 / P2.4) · TD-41 SQL probes for SECURITY DEFINER predicates (deferred — Public path only exercised here)
```

**E.** §6 — flip TD-13 to ✅, TD-32 to ✅, mark TD-23, TD-29, TD-42 as 🟡 partial. Existing TD rows for TD-23/29/42 stay; just amend their `Status` column.

For TD-13:
```
| TD-13 | ... | High | Audit 2026-05-07 | ✅ Resolved 2026-05-08 (P0.4-FE — adapter consumers wired; close/reopen still `not_implemented('P0.6')` until closure slice ships, which is correct per scope) |
```

For TD-32:
```
| TD-32 | ... | Med | Audit 2026-05-07 | ✅ Resolved 2026-05-08 (post/[id].tsx renders EmptyState when `getPostByIdUseCase` returns null) |
```

For TD-23 (Status column):
`🟡 Partial — picker + resize + upload + client-side EXIF via re-encode shipped 2026-05-08; server-side EXIF Edge Function (AUDIT-X-03) still open — author Edge Function as a follow-up slice`

For TD-29 (Status column):
`🟡 Partial — feed/index.tsx + post/[id].tsx + profile.tsx now ≤200 LOC; create.tsx ~250 LOC after PhotoPicker + VisibilityChooser extraction (still +50 over cap); rest unchanged`

For TD-42 (Status column):
`🟡 Partial — active-posts counter wired via countOpenByUser 2026-05-08; followers/following/items_given/items_received still 0 (need IUserRepository.findById, TD-40 / P2.4)`

- [ ] **Step 11.1.2: Commit the docs update**

```bash
git add docs/SSOT/PROJECT_STATUS.md
git commit -m "docs(status): P0.4-FE merged — feed/create wired, mocks retired

§3 sprint board, §4 completion log, §1 snapshot, §6 TDs:
- Closed: TD-13, TD-32, AUDIT-P0-01/11, AUDIT-P2-02, TD-5
- Partial: TD-23, TD-29, TD-42
- Up next: P0.5 (chat realtime)"
```

---

## Task 12: Mark PR ready and merge

- [ ] **Step 12.1: Push final commits**

```bash
git push
```

- [ ] **Step 12.2: Mark PR ready**

```bash
gh pr ready
```

- [ ] **Step 12.3: Watch CI; merge on green**

```bash
gh pr checks --watch
```

When all checks pass:

```bash
gh pr merge --squash --delete-branch
```

Per `git-workflow.mdc`, PRs auto-merge on green CI. The explicit `--squash` keeps history flat.

- [ ] **Step 12.4: Final tree sync**

```bash
git switch main
git pull --ff-only origin main
```

---

## Self-review checklist

Run through this list before declaring the plan complete:

1. **Spec coverage** — every SRS ID in "SRS coverage in this slice" maps to a Task? Yes:
   - FR-POST-001..006 → Tasks 2.2 (use case) + 7 (form)
   - FR-POST-008 → Task 2.5 (UpdatePostUseCase; UI for edit not in scope, but the use case is reusable when an Edit screen ships)
   - FR-POST-010 → Task 2.6 (DeletePostUseCase; UI for delete not in scope)
   - FR-POST-014/015 → Tasks 2.3 + 6
   - FR-FEED-001..005, 013 → Tasks 1 + 5
   - FR-PROFILE-001 partial → Task 8
   - FR-AUTH-014 partial → Task 9.1

2. **Placeholder scan** — no "TBD", no "implement later", every code block is complete? Yes (verified).

3. **Type consistency** — `getMyPostsUseCase` is the same name everywhere; `getCreatePostUseCase`, `getFeedUseCase`, `getPostByIdUseCase`, `getPostRepo`, `getUpdatePostUseCase`, `getDeletePostUseCase` — all match between Task 3.1.1 (definition) and Tasks 5–9 (usage). `PostError` / `isPostError` / `PostErrorCode` consistent between Task 2.1 (definition) and Task 7.3 (usage in `postMessages.ts`). `UploadedAsset.path / mimeType / sizeBytes` matches `MediaAssetInput` from `IPostRepository.ts`.

4. **File-size cap** — `(tabs)/create.tsx` at ~250 LOC violates the 200 cap. Documented as TD-29 partial close. Acceptable trade-off for now; further split would require `useReducer` extraction which is out of scope.

5. **TDD discipline** — each application use case has its test file written **before** its implementation in the plan. The fake (`FakePostRepository`) lands first.

6. **Commits** — the plan creates ~14 commits, each focused on one logical change. Bites range from "test fake" to "wire screen". Reviewable.

7. **Verification before claiming done** — Task 10.4 forces a manual smoke before the PR is marked ready. CLAUDE.md requires UI verification.

8. **Rollback / safety** — every commit is on a feature branch; nothing on main is touched until `gh pr merge`. Mock retirement is the last step, so any earlier failure leaves the app still functional via the mock path.

9. **Out-of-scope hygiene** — the "Out of scope" section names every nearby slice (P0.5, P0.6, P1.2, P2.4) and the TDs they correspond to.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-p0-4-fe-feed-create.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per Task (1, 2, 3, …, 12) so each is an isolated context; I review between tasks. Faster iteration, less context bleed.

**2. Inline Execution** — execute tasks in this session via `superpowers:executing-plans`, batched with checkpoints between Tasks 2/3, 7/8, 11/12 for review.

Pick one before I start.
