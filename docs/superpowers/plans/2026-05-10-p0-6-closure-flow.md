# P0.6 — Closure Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the closure UX (`FR-CLOSURE-001..005`) so post owners can mark a post as delivered (with or without a recipient) and reopen if they made a mistake. Add the daily cleanup cron (`FR-CLOSURE-008`). Verify stat-projection triggers (`FR-CLOSURE-009`) fire correctly.

**Architecture:** Schema, RLS, and stat triggers already shipped in `0001`/`0002`/`0006`. This plan fills four layers:
1. **Application** — 4 new use cases (TDD), 2 port additions, 4 new error codes.
2. **Database** — 2 new migrations: `0015_closure_rpcs.sql` (atomic `close_post_with_recipient` + `reopen_post_marked` RPCs) and `0016_closure_cleanup_cron.sql` (daily `pg_cron` job + Storage cleanup helper).
3. **Infrastructure** — Implement `close`, `reopen`, `getClosureCandidates` on `SupabasePostRepository`; add `dismissClosureExplainer` on `SupabaseUserRepository`.
4. **UI** — 5 new components (3-step closure flow with hybrid Step 1+2 sheet, separate Step 3 sheet, reopen modal, recipient row, owner actions bar), 1 store, edits to `post/[id].tsx` and `(tabs)/profile.tsx`.

**Tech Stack:** TypeScript 5.5, vitest, `@supabase/supabase-js@^2.69`, Postgres + `pg_cron`, React Native + expo-router, Zustand, `@tanstack/react-query`. No new runtime deps.

**Lane:** Single agent, single PR, single branch (`feat/FR-CLOSURE-001-closure-flow`). The branch is already created with the design spec committed.

**SRS coverage in this slice:**
- FR-CLOSURE-001 (initiate from PostDetail), -002 (Step 1 confirm), -003 (Step 2 picker), -004 (Step 3 explainer), -005 (reopen).
- FR-CLOSURE-008 (cleanup cron).
- FR-CLOSURE-009 (verify existing trigger projection).

**Out of scope (TDs to file at end of plan):**
- FR-CLOSURE-006 (notify recipient on mark — depends on FR-NOTIF push, P1.5) → TD-119.
- FR-CLOSURE-007 (recipient un-marks self) → TD-120.
- FR-CLOSURE-010 (suspect flag at 5+ reopens — depends on FR-MOD-008) → TD-121.
- Storage orphan reconciliation → TD-122.
- Telemetry events (e.g. `closure_step1_completed`) — no telemetry infra in repo yet → TD-123.

---

## File Structure

| Path | Purpose | Status |
| ---- | ------- | ------ |
| `app/packages/application/src/posts/errors.ts` | Add 4 new closure-related codes. | **Modify** |
| `app/packages/application/src/ports/IPostRepository.ts` | Add `getClosureCandidates`; tighten `close` doc. | **Modify** |
| `app/packages/application/src/ports/IUserRepository.ts` | Add `dismissClosureExplainer`. | **Modify** |
| `app/packages/application/src/posts/MarkAsDeliveredUseCase.ts` | Validate owner + status, branch with/without recipient. | **Create** |
| `app/packages/application/src/posts/ReopenPostUseCase.ts` | Validate owner + status + grace; call `repo.reopen`. | **Create** |
| `app/packages/application/src/posts/GetClosureCandidatesUseCase.ts` | Forward to repo, filter blocked. | **Create** |
| `app/packages/application/src/auth/DismissClosureExplainerUseCase.ts` | Single UPDATE wrapper (owner-side flag). | **Create** |
| `app/packages/application/src/posts/__tests__/MarkAsDeliveredUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/posts/__tests__/ReopenPostUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/posts/__tests__/GetClosureCandidatesUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/auth/__tests__/DismissClosureExplainerUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/posts/__tests__/fakePostRepository.ts` | Extend with `close`/`reopen`/`getClosureCandidates` mocks. | **Modify** |
| `app/packages/application/src/posts/index.ts` | Re-export new use cases. | **Modify** |
| `supabase/migrations/0015_closure_rpcs.sql` | Two RPCs: `close_post_with_recipient`, `reopen_post_marked`. | **Create** |
| `supabase/migrations/0016_closure_cleanup_cron.sql` | `pg_cron` setup + `closure_cleanup_expired()` function + storage helper trigger. | **Create** |
| `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` | Implement `close`, `reopen`, `getClosureCandidates`. | **Modify** |
| `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` | Implement `dismissClosureExplainer`. | **Modify** |
| `app/packages/infrastructure-supabase/src/database.types.ts` | Regenerate to include new RPC signatures. | **Modify (regenerated)** |
| `app/apps/mobile/src/components/closure/ClosureSheet.tsx` | Step 1+2 hybrid bottom sheet. | **Create** |
| `app/apps/mobile/src/components/closure/ClosureExplainerSheet.tsx` | Step 3 one-time explainer. | **Create** |
| `app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx` | Reopen confirmation (two copy variants). | **Create** |
| `app/apps/mobile/src/components/closure/RecipientPickerRow.tsx` | Single picker row. | **Create** |
| `app/apps/mobile/src/components/post-detail/OwnerActionsBar.tsx` | Extracted owner CTAs from `post/[id].tsx`. | **Create** |
| `app/apps/mobile/src/store/closureStore.ts` | Zustand: composition root for closure use cases. | **Create** |
| `app/apps/mobile/src/composition/index.ts` (if exists) | Wire new use cases. | **Modify** |
| `app/apps/mobile/app/post/[id].tsx` | Mount `<OwnerActionsBar>`. | **Modify** |
| `app/apps/mobile/app/(tabs)/profile.tsx` | Include `deleted_no_recipient` in 'closed' filter; show "Reopen" CTA per row. | **Modify** |
| `docs/SSOT/PROJECT_STATUS.md` | P0.5 → Done; P0.6 → In progress → Done; Last Updated. | **Modify** |
| `docs/SSOT/HISTORY.md` | New top entry. | **Modify** |
| `docs/SSOT/TECH_DEBT.md` | TD-119..123 (open); TD-42 stays Resolved. | **Modify** |
| `docs/OPERATOR_RUNBOOK.md` | Section: enable `pg_cron` extension on Supabase dashboard. | **Modify** |

---

## Pre-flight

- [ ] **Step 0.1: Confirm clean tree on the closure branch**

```bash
cd /Users/navesarussi/KC/MVP-2
git status
git branch --show-current
```

Expected: working tree clean; branch is `feat/FR-CLOSURE-001-closure-flow` with the spec already committed (`08fe977`).

- [ ] **Step 0.2: Confirm baseline typecheck + tests**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/domain typecheck
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: all four exit 0. ~79 vitest pass. If not, fix baseline before continuing.

- [ ] **Step 0.3: Verify schema state**

```bash
grep -E "closed_delivered|reopen_count|delete_after|closure_explainer_dismissed|recipients" \
  /Users/navesarussi/KC/MVP-2/supabase/migrations/0001_init_users.sql \
  /Users/navesarussi/KC/MVP-2/supabase/migrations/0002_init_posts.sql \
  /Users/navesarussi/KC/MVP-2/supabase/migrations/0006_init_stats_counters.sql | wc -l
```

Expected: > 20 matches. Confirms the spec assumption that schema is already in place.

---

## Task 1: Add closure error codes

**Files:**
- Modify: `app/packages/application/src/posts/errors.ts`

- [ ] **Step 1.1: Add 4 codes to the union**

Edit `app/packages/application/src/posts/errors.ts`. Replace the `PostErrorCode` union with:

```ts
export type PostErrorCode =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'address_required'
  | 'address_invalid'
  | 'street_number_invalid'
  | 'city_not_found'
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
  | 'forbidden'
  | 'closure_not_owner'
  | 'closure_wrong_status'
  | 'closure_recipient_not_in_chat'
  | 'reopen_window_expired'
  | 'unknown';
```

- [ ] **Step 1.2: Verify typecheck still green**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application typecheck
```

Expected: exit 0.

- [ ] **Step 1.3: Commit**

```bash
git add app/packages/application/src/posts/errors.ts
git commit -m "feat(closure): add 4 PostError codes for FR-CLOSURE-001..005

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Extend `IPostRepository` (contract)

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts`

- [ ] **Step 2.1: Add `ClosureCandidate` type and method**

Append to `IPostRepository.ts` (after `PostWithOwner` interface, before `IPostRepository`):

```ts
export interface ClosureCandidate {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  cityName: string | null;
  lastMessageAt: string;
}
```

Inside the `IPostRepository` interface, replace the `// Closure (filled in P0.6 — closure flow slice)` block with:

```ts
  // Closure (FR-CLOSURE-001..005)
  // close: branches inside the impl —
  //   recipientUserId !== null  → RPC `close_post_with_recipient` (atomic insert + status)
  //   recipientUserId === null  → UPDATE status='deleted_no_recipient', delete_after=now()+7d
  // Both paths bump items_given_count via the existing posts trigger; the
  // recipient path also bumps items_received_count via the recipients trigger.
  close(postId: string, recipientUserId: string | null): Promise<Post>;
  // reopen: branches inside the impl —
  //   current status closed_delivered      → RPC `reopen_post_marked` (delete recipient row + status)
  //   current status deleted_no_recipient  → UPDATE status='open', delete_after=null
  reopen(postId: string): Promise<Post>;
  // Recipient picker source: distinct chat partners on this post,
  // sorted by recency of their latest message in the anchored chat.
  // Excludes blocked users (filtered in the use case, not the query).
  getClosureCandidates(postId: string): Promise<ClosureCandidate[]>;
```

- [ ] **Step 2.2: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application typecheck
```

Expected: exit 0 (existing impl already declares `close`/`reopen` stubs; `getClosureCandidates` is the only new break).

If the existing `SupabasePostRepository` doesn't implement `getClosureCandidates`, typecheck on `@kc/infrastructure-supabase` will fail. That's fine — Task 7 fixes it. For now:

```bash
pnpm --filter @kc/infrastructure-supabase typecheck 2>&1 | tail -5
```

Expected: TS error mentioning `getClosureCandidates`. **This is OK** — leave it red until Task 7.

- [ ] **Step 2.3: Commit (contract change, isolated commit)**

```bash
git add app/packages/application/src/ports/IPostRepository.ts
git commit -m "feat(contract): IPostRepository.getClosureCandidates + close/reopen docs

Per parallel-agents §6.4: contract changes ship in their own commit.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Extend `IUserRepository` (contract)

**Files:**
- Modify: `app/packages/application/src/ports/IUserRepository.ts`

- [ ] **Step 3.1: Add `dismissClosureExplainer`**

Insert into the `IUserRepository` interface, near the `setBiography` / profile-mutation methods:

```ts
  /** FR-CLOSURE-004 AC3 — flips users.closure_explainer_dismissed = true. Idempotent. */
  dismissClosureExplainer(userId: string): Promise<void>;
```

- [ ] **Step 3.2: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application typecheck
```

Expected: exit 0.

`@kc/infrastructure-supabase` typecheck will now have TWO missing methods. Still fine — both fixed in Tasks 7+8.

- [ ] **Step 3.3: Commit**

```bash
git add app/packages/application/src/ports/IUserRepository.ts
git commit -m "feat(contract): IUserRepository.dismissClosureExplainer (FR-CLOSURE-004)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Extend `FakePostRepository` test helper

**Files:**
- Modify: `app/packages/application/src/posts/__tests__/fakePostRepository.ts`

- [ ] **Step 4.1: Read the current helper**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/posts/__tests__/fakePostRepository.ts
```

Note the existing fields and `makePostWithOwner` factory.

- [ ] **Step 4.2: Add closure-related fields and methods**

Add to the class:

```ts
  // ── Closure (P0.6) ────────────────────────────────────────────────────────
  closeResult: Post | null = null;
  reopenResult: Post | null = null;
  closureCandidatesResult: ClosureCandidate[] = [];
  lastCloseArgs: { postId: string; recipientUserId: string | null } | null = null;
  lastReopenArgs: { postId: string } | null = null;
  closeShouldThrow: PostError | null = null;
  reopenShouldThrow: PostError | null = null;

  async close(postId: string, recipientUserId: string | null): Promise<Post> {
    this.lastCloseArgs = { postId, recipientUserId };
    if (this.closeShouldThrow) throw this.closeShouldThrow;
    if (!this.closeResult) throw new Error('FakePostRepository.closeResult not set');
    return this.closeResult;
  }

  async reopen(postId: string): Promise<Post> {
    this.lastReopenArgs = { postId };
    if (this.reopenShouldThrow) throw this.reopenShouldThrow;
    if (!this.reopenResult) throw new Error('FakePostRepository.reopenResult not set');
    return this.reopenResult;
  }

  async getClosureCandidates(_postId: string): Promise<ClosureCandidate[]> {
    return this.closureCandidatesResult;
  }
```

Add to imports at the top:

```ts
import type { ClosureCandidate } from '../../ports/IPostRepository';
import type { PostError } from '../errors';
```

- [ ] **Step 4.3: Add `makeClosureCandidate` factory**

Append:

```ts
export function makeClosureCandidate(overrides: Partial<ClosureCandidate> = {}): ClosureCandidate {
  return {
    userId: 'u_recipient',
    fullName: 'דנה לוי',
    avatarUrl: null,
    cityName: 'תל אביב',
    lastMessageAt: '2026-05-10T10:00:00.000Z',
    ...overrides,
  };
}
```

- [ ] **Step 4.4: Verify existing tests still pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test
```

Expected: ~79 tests pass (no new tests yet; helper additions are non-breaking).

- [ ] **Step 4.5: Commit**

```bash
git add app/packages/application/src/posts/__tests__/fakePostRepository.ts
git commit -m "test: extend FakePostRepository with closure mocks

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: `MarkAsDeliveredUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/posts/MarkAsDeliveredUseCase.ts`
- Create: `app/packages/application/src/posts/__tests__/MarkAsDeliveredUseCase.test.ts`

- [ ] **Step 5.1: Write failing test**

Create `app/packages/application/src/posts/__tests__/MarkAsDeliveredUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MarkAsDeliveredUseCase } from '../MarkAsDeliveredUseCase';
import {
  FakePostRepository,
  makePostWithOwner,
  makeClosureCandidate,
} from './fakePostRepository';
import type { Post } from '@kc/domain';

const baseClosed = (overrides: Partial<Post> = {}): Post => ({
  ...makePostWithOwner(),
  status: 'closed_delivered',
  ...overrides,
});

describe('MarkAsDeliveredUseCase', () => {
  it('closes with a recipient when one is provided', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closureCandidatesResult = [makeClosureCandidate({ userId: 'u_recipient' })];
    repo.closeResult = baseClosed();
    const uc = new MarkAsDeliveredUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      ownerId: 'u_owner',
      recipientUserId: 'u_recipient',
    });

    expect(out.post.status).toBe('closed_delivered');
    expect(repo.lastCloseArgs).toEqual({ postId: 'p_1', recipientUserId: 'u_recipient' });
  });

  it('closes without a recipient when null is provided', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closeResult = baseClosed({ status: 'deleted_no_recipient' });
    const uc = new MarkAsDeliveredUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      ownerId: 'u_owner',
      recipientUserId: null,
    });

    expect(out.post.status).toBe('deleted_no_recipient');
    expect(repo.lastCloseArgs).toEqual({ postId: 'p_1', recipientUserId: null });
  });

  it('rejects when caller is not the owner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_other', status: 'open' });
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'closure_not_owner' });
  });

  it('rejects when post is not open', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'closed_delivered' });
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'closure_wrong_status' });
  });

  it('rejects when recipient is not a chat partner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closureCandidatesResult = [makeClosureCandidate({ userId: 'u_someone_else' })];
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: 'u_imposter' }),
    ).rejects.toMatchObject({ code: 'closure_recipient_not_in_chat' });
  });

  it('rejects when post does not exist', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_missing', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
```

- [ ] **Step 5.2: Run test — verify it fails**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test MarkAsDeliveredUseCase
```

Expected: FAIL — "Cannot find module '../MarkAsDeliveredUseCase'".

- [ ] **Step 5.3: Implement use case**

Create `app/packages/application/src/posts/MarkAsDeliveredUseCase.ts`:

```ts
/** FR-CLOSURE-001..003: validate owner + status + recipient, then close. */
import type { Post } from '@kc/domain';
import type { IPostRepository } from '../ports/IPostRepository';
import { PostError } from './errors';

export interface MarkAsDeliveredInput {
  postId: string;
  ownerId: string;
  recipientUserId: string | null;
}

export interface MarkAsDeliveredOutput {
  post: Post;
}

export class MarkAsDeliveredUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: MarkAsDeliveredInput): Promise<MarkAsDeliveredOutput> {
    const post = await this.repo.findById(input.postId, input.ownerId);
    if (!post) throw new PostError('forbidden', 'post_not_found');
    if (post.ownerId !== input.ownerId) throw new PostError('closure_not_owner', 'closure_not_owner');
    if (post.status !== 'open') throw new PostError('closure_wrong_status', 'closure_wrong_status');

    if (input.recipientUserId !== null) {
      const candidates = await this.repo.getClosureCandidates(input.postId);
      const isPartner = candidates.some((c) => c.userId === input.recipientUserId);
      if (!isPartner)
        throw new PostError('closure_recipient_not_in_chat', 'closure_recipient_not_in_chat');
    }

    const closed = await this.repo.close(input.postId, input.recipientUserId);
    return { post: closed };
  }
}
```

- [ ] **Step 5.4: Run test — verify pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test MarkAsDeliveredUseCase
```

Expected: 6 tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add app/packages/application/src/posts/MarkAsDeliveredUseCase.ts \
        app/packages/application/src/posts/__tests__/MarkAsDeliveredUseCase.test.ts
git commit -m "feat(closure): MarkAsDeliveredUseCase + tests (FR-CLOSURE-001..003)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: `ReopenPostUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/posts/ReopenPostUseCase.ts`
- Create: `app/packages/application/src/posts/__tests__/ReopenPostUseCase.test.ts`

- [ ] **Step 6.1: Write failing test**

Create `app/packages/application/src/posts/__tests__/ReopenPostUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ReopenPostUseCase } from '../ReopenPostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';
import type { Post } from '@kc/domain';

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

describe('ReopenPostUseCase', () => {
  it('reopens a closed_delivered post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'closed_delivered' });
    repo.reopenResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    const out = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(out.post.status).toBe('open');
    expect(repo.lastReopenArgs).toEqual({ postId: 'p_1' });
  });

  it('reopens a deleted_no_recipient post within grace window', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({
      ownerId: 'u_owner',
      status: 'deleted_no_recipient',
      deleteAfter: future,
    });
    repo.reopenResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    const out = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(out.post.status).toBe('open');
  });

  it('rejects reopen of deleted_no_recipient past grace', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({
      ownerId: 'u_owner',
      status: 'deleted_no_recipient',
      deleteAfter: past,
    });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'reopen_window_expired',
    });
  });

  it('rejects reopen by non-owner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_other', status: 'closed_delivered' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_not_owner',
    });
  });

  it('rejects reopen of an already-open post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_wrong_status',
    });
  });

  it('rejects reopen of a removed_admin post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'removed_admin' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_wrong_status',
    });
  });
});
```

- [ ] **Step 6.2: Run test — verify it fails**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test ReopenPostUseCase
```

Expected: FAIL — module not found.

- [ ] **Step 6.3: Implement use case**

Create `app/packages/application/src/posts/ReopenPostUseCase.ts`:

```ts
/** FR-CLOSURE-005: reopen a closed post (with cleanup of recipient row + counter deltas via triggers). */
import type { Post } from '@kc/domain';
import type { IPostRepository } from '../ports/IPostRepository';
import { PostError } from './errors';

export interface ReopenPostInput {
  postId: string;
  ownerId: string;
}

export interface ReopenPostOutput {
  post: Post;
}

export class ReopenPostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: ReopenPostInput): Promise<ReopenPostOutput> {
    const post = await this.repo.findById(input.postId, input.ownerId);
    if (!post) throw new PostError('forbidden', 'post_not_found');
    if (post.ownerId !== input.ownerId) throw new PostError('closure_not_owner', 'closure_not_owner');

    const isReopenable =
      post.status === 'closed_delivered' || post.status === 'deleted_no_recipient';
    if (!isReopenable) throw new PostError('closure_wrong_status', 'closure_wrong_status');

    if (post.status === 'deleted_no_recipient') {
      const deleteAfter = post.deleteAfter ? new Date(post.deleteAfter).getTime() : 0;
      if (deleteAfter <= Date.now())
        throw new PostError('reopen_window_expired', 'reopen_window_expired');
    }

    const reopened = await this.repo.reopen(input.postId);
    return { post: reopened };
  }
}
```

- [ ] **Step 6.4: Run test — verify pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test ReopenPostUseCase
```

Expected: 6 tests pass.

- [ ] **Step 6.5: Commit**

```bash
git add app/packages/application/src/posts/ReopenPostUseCase.ts \
        app/packages/application/src/posts/__tests__/ReopenPostUseCase.test.ts
git commit -m "feat(closure): ReopenPostUseCase + tests (FR-CLOSURE-005)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: `GetClosureCandidatesUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/posts/GetClosureCandidatesUseCase.ts`
- Create: `app/packages/application/src/posts/__tests__/GetClosureCandidatesUseCase.test.ts`

- [ ] **Step 7.1: Inspect FakeBlockRepository or IBlockRepository**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/ports/IBlockRepository.ts
```

Note the existing methods. Need an `isBlocked(blockerId, blockedId)` or `getBlockedUsers(userId)` that we can use.

- [ ] **Step 7.2: Write failing test**

Create `app/packages/application/src/posts/__tests__/GetClosureCandidatesUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GetClosureCandidatesUseCase } from '../GetClosureCandidatesUseCase';
import { FakePostRepository, makeClosureCandidate } from './fakePostRepository';

class FakeBlockRepo {
  blockedIds: Set<string> = new Set();
  async getBlockedUsers(): Promise<{ userId: string }[]> {
    return Array.from(this.blockedIds).map((userId) => ({ userId }));
  }
}

describe('GetClosureCandidatesUseCase', () => {
  it('returns all candidates when no one is blocked', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [
      makeClosureCandidate({ userId: 'u_a', fullName: 'דנה' }),
      makeClosureCandidate({ userId: 'u_b', fullName: 'יוסי' }),
    ];
    const blockRepo = new FakeBlockRepo();
    const uc = new GetClosureCandidatesUseCase(postRepo, blockRepo as never);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.userId)).toEqual(['u_a', 'u_b']);
  });

  it('filters out blocked candidates', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [
      makeClosureCandidate({ userId: 'u_a' }),
      makeClosureCandidate({ userId: 'u_b' }),
    ];
    const blockRepo = new FakeBlockRepo();
    blockRepo.blockedIds.add('u_b');
    const uc = new GetClosureCandidatesUseCase(postRepo, blockRepo as never);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].userId).toBe('u_a');
  });

  it('returns empty when no chat partners exist', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [];
    const blockRepo = new FakeBlockRepo();
    const uc = new GetClosureCandidatesUseCase(postRepo, blockRepo as never);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toEqual([]);
  });
});
```

- [ ] **Step 7.3: Run test — verify it fails**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test GetClosureCandidatesUseCase
```

Expected: FAIL.

- [ ] **Step 7.4: Implement use case**

Create `app/packages/application/src/posts/GetClosureCandidatesUseCase.ts`:

```ts
/** FR-CLOSURE-003 AC1/AC2: distinct chat partners on this post, sorted by recency, blocked filtered. */
import type { ClosureCandidate, IPostRepository } from '../ports/IPostRepository';
import type { IBlockRepository } from '../ports/IBlockRepository';

export interface GetClosureCandidatesInput {
  postId: string;
  ownerId: string;
}

export class GetClosureCandidatesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly blockRepo: IBlockRepository,
  ) {}

  async execute(input: GetClosureCandidatesInput): Promise<ClosureCandidate[]> {
    const [candidates, blocked] = await Promise.all([
      this.postRepo.getClosureCandidates(input.postId),
      this.blockRepo.getBlockedUsers(input.ownerId),
    ]);
    const blockedIds = new Set(blocked.map((u) => u.userId));
    return candidates.filter((c) => !blockedIds.has(c.userId));
  }
}
```

- [ ] **Step 7.5: Run test — verify pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test GetClosureCandidatesUseCase
```

Expected: 3 tests pass.

If `IBlockRepository.getBlockedUsers` returns a different shape (e.g., `User[]` rather than `{userId}[]`), adjust the implementation:

```ts
const blockedIds = new Set(blocked.map((u) => u.userId ?? u.user_id));
```

Look at the actual `IBlockRepository` (read from Step 7.1) and match.

- [ ] **Step 7.6: Commit**

```bash
git add app/packages/application/src/posts/GetClosureCandidatesUseCase.ts \
        app/packages/application/src/posts/__tests__/GetClosureCandidatesUseCase.test.ts
git commit -m "feat(closure): GetClosureCandidatesUseCase + tests (FR-CLOSURE-003 AC1/AC2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: `DismissClosureExplainerUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/auth/DismissClosureExplainerUseCase.ts`
- Create: `app/packages/application/src/auth/__tests__/DismissClosureExplainerUseCase.test.ts`

- [ ] **Step 8.1: Inspect existing fake user repo (if any)**

```bash
ls /Users/navesarussi/KC/MVP-2/app/packages/application/src/auth/__tests__/
```

If there's a `fakeUserRepository.ts`, read it. Otherwise create a minimal inline fake in the test.

- [ ] **Step 8.2: Write failing test**

Create `app/packages/application/src/auth/__tests__/DismissClosureExplainerUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DismissClosureExplainerUseCase } from '../DismissClosureExplainerUseCase';
import type { IUserRepository } from '../../ports/IUserRepository';

class FakeUserRepo {
  dismissCalls: string[] = [];
  async dismissClosureExplainer(userId: string): Promise<void> {
    this.dismissCalls.push(userId);
  }
}

describe('DismissClosureExplainerUseCase', () => {
  it('forwards the userId to the repo', async () => {
    const repo = new FakeUserRepo();
    const uc = new DismissClosureExplainerUseCase(repo as unknown as IUserRepository);

    await uc.execute({ userId: 'u_1' });

    expect(repo.dismissCalls).toEqual(['u_1']);
  });

  it('is idempotent — calling twice does not error', async () => {
    const repo = new FakeUserRepo();
    const uc = new DismissClosureExplainerUseCase(repo as unknown as IUserRepository);

    await uc.execute({ userId: 'u_1' });
    await uc.execute({ userId: 'u_1' });

    expect(repo.dismissCalls).toEqual(['u_1', 'u_1']);
  });
});
```

- [ ] **Step 8.3: Run test — verify it fails**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test DismissClosureExplainerUseCase
```

Expected: FAIL — module not found.

- [ ] **Step 8.4: Implement use case**

Create `app/packages/application/src/auth/DismissClosureExplainerUseCase.ts`:

```ts
/** FR-CLOSURE-004 AC3: persist `User.closureExplainerDismissed = true`. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface DismissClosureExplainerInput {
  userId: string;
}

export class DismissClosureExplainerUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: DismissClosureExplainerInput): Promise<void> {
    await this.repo.dismissClosureExplainer(input.userId);
  }
}
```

- [ ] **Step 8.5: Run test — verify pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application test DismissClosureExplainerUseCase
```

Expected: 2 tests pass.

- [ ] **Step 8.6: Commit**

```bash
git add app/packages/application/src/auth/DismissClosureExplainerUseCase.ts \
        app/packages/application/src/auth/__tests__/DismissClosureExplainerUseCase.test.ts
git commit -m "feat(closure): DismissClosureExplainerUseCase + tests (FR-CLOSURE-004 AC3)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Re-export new use cases

**Files:**
- Modify: `app/packages/application/src/posts/index.ts`
- Modify: `app/packages/application/src/auth/index.ts` (if exists)
- Modify: `app/packages/application/src/index.ts` (if it surfaces use cases)

- [ ] **Step 9.1: Inspect current barrels**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/posts/index.ts
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/auth/index.ts 2>/dev/null
```

- [ ] **Step 9.2: Add new exports**

In `posts/index.ts` add:

```ts
export * from './MarkAsDeliveredUseCase';
export * from './ReopenPostUseCase';
export * from './GetClosureCandidatesUseCase';
```

In `auth/index.ts` (or wherever auth use cases are barrel-exported) add:

```ts
export * from './DismissClosureExplainerUseCase';
```

- [ ] **Step 9.3: Verify typecheck + tests**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/application typecheck
pnpm --filter @kc/application test
```

Expected: typecheck 0; tests show ~96 passing (79 existing + ~17 new).

- [ ] **Step 9.4: Commit**

```bash
git add app/packages/application/src/posts/index.ts app/packages/application/src/auth/index.ts
git commit -m "feat(closure): re-export new use cases from package barrels

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Migration `0015_closure_rpcs.sql`

**Files:**
- Create: `supabase/migrations/0015_closure_rpcs.sql`

- [ ] **Step 10.1: Inspect existing migration patterns**

```bash
head -40 /Users/navesarussi/KC/MVP-2/supabase/migrations/0014_donation_categories_and_links.sql
grep -n "raise exception\|raise notice" /Users/navesarussi/KC/MVP-2/supabase/migrations/0002_init_posts.sql | head -5
```

Match the comment header style and error-raising convention.

- [ ] **Step 10.2: Write the migration**

Create `supabase/migrations/0015_closure_rpcs.sql`:

```sql
-- 0015_closure_rpcs | P0.6 — Closure flow RPCs (FR-CLOSURE-003, FR-CLOSURE-005)
--
-- Two atomic functions for the multi-table closure transitions:
--   1. close_post_with_recipient(p_post_id, p_recipient_user_id)
--      INSERT recipients row + UPDATE posts.status = 'closed_delivered'.
--      Triggers cascade: items_received +1 (recipients_after_insert_counters),
--      items_given +1 (posts_after_update_counters).
--   2. reopen_post_marked(p_post_id)
--      DELETE recipients row + UPDATE posts.status = 'open'.
--      Triggers cascade: items_received −1, items_given −1.
--
-- Single-table transitions stay as plain UPDATEs from the client:
--   • close without recipient → UPDATE posts SET status='deleted_no_recipient', delete_after=now()+'7 days'.
--   • reopen of deleted_no_recipient → UPDATE posts SET status='open', delete_after=null.
--
-- All functions are SECURITY INVOKER — they rely on the existing 0002 RLS:
-- posts_update_owner (UPDATE), recipients_insert_owner (INSERT),
-- recipients_delete_participants (DELETE). RLS on the underlying rows
-- enforces ownership; the function just composes the multi-statement work.
--
-- Errors map to client PostError codes via SQLSTATE:
--   P0001 (raise_exception)   → generic forbidden / wrong status
--   message text:
--     'closure_not_owner'             → not the owner
--     'closure_wrong_status'          → post not in expected state
--     'closure_recipient_not_in_chat' → recipient not a chat partner

set search_path = public;

-- ── 1. close_post_with_recipient ────────────────────────────────────────────
create or replace function public.close_post_with_recipient(
  p_post_id uuid,
  p_recipient_user_id uuid
)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner   uuid;
  v_status  text;
  v_post    public.posts;
  v_chat_ok boolean;
begin
  -- Lock the post row to serialize concurrent close attempts.
  select owner_id, status into v_owner, v_status
    from public.posts
   where post_id = p_post_id
   for update;

  if v_owner is null then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'closure_not_owner' using errcode = 'P0001';
  end if;
  if v_status <> 'open' then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;

  -- Recipient must be a chat partner anchored to this post.
  -- Owner is excluded by definition (a chat has user_a + user_b; recipient is the other side).
  select exists (
    select 1
      from public.chats c
      join public.messages m on m.chat_id = c.chat_id
     where c.anchor_post_id = p_post_id
       and (
         (c.user_a = v_owner and c.user_b = p_recipient_user_id) or
         (c.user_b = v_owner and c.user_a = p_recipient_user_id)
       )
  ) into v_chat_ok;

  if not v_chat_ok then
    raise exception 'closure_recipient_not_in_chat' using errcode = 'P0001';
  end if;

  -- Insert recipient first (trigger fires items_received +1).
  insert into public.recipients (post_id, recipient_user_id)
       values (p_post_id, p_recipient_user_id);

  -- Then flip status (trigger fires items_given +1).
  update public.posts
     set status = 'closed_delivered',
         delete_after = null,
         updated_at = now()
   where post_id = p_post_id
   returning * into v_post;

  return v_post;
end;
$$;

grant execute on function public.close_post_with_recipient(uuid, uuid) to authenticated;

-- ── 2. reopen_post_marked ───────────────────────────────────────────────────
create or replace function public.reopen_post_marked(p_post_id uuid)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner   uuid;
  v_status  text;
  v_post    public.posts;
begin
  select owner_id, status into v_owner, v_status
    from public.posts
   where post_id = p_post_id
   for update;

  if v_owner is null then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'closure_not_owner' using errcode = 'P0001';
  end if;
  if v_status <> 'closed_delivered' then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;

  -- Delete the recipient row (trigger fires items_received −1).
  delete from public.recipients where post_id = p_post_id;

  -- Flip status back to open + bump reopen_count (trigger fires items_given −1).
  update public.posts
     set status = 'open',
         reopen_count = reopen_count + 1,
         delete_after = null,
         updated_at = now()
   where post_id = p_post_id
   returning * into v_post;

  return v_post;
end;
$$;

grant execute on function public.reopen_post_marked(uuid) to authenticated;

-- end of 0015_closure_rpcs
```

- [ ] **Step 10.3: Apply migration locally (or skip if no local Supabase)**

If the project uses local Supabase:

```bash
cd /Users/navesarussi/KC/MVP-2
supabase db reset
# or if reset is too aggressive:
supabase migration up 0015_closure_rpcs.sql
```

Otherwise apply manually via the Supabase dashboard SQL editor on the dev project.

- [ ] **Step 10.4: Smoke test the RPCs**

In the SQL editor (signed in as a test user):

```sql
-- Pre-state: pick a post you own that's open and has a chat partner
select post_id, status, owner_id from public.posts
 where owner_id = auth.uid() and status = 'open' limit 1;

-- Replace :post_id and :recipient_id below
select * from public.close_post_with_recipient(:post_id, :recipient_id);

-- Verify
select post_id, status from public.posts where post_id = :post_id;
select * from public.recipients where post_id = :post_id;
select items_given_count, items_received_count from public.users where user_id in (auth.uid(), :recipient_id);
```

Expected: status='closed_delivered'; one recipient row; counter deltas applied.

Then test reopen:

```sql
select * from public.reopen_post_marked(:post_id);
select status, reopen_count from public.posts where post_id = :post_id;
select items_given_count, items_received_count from public.users where user_id in (auth.uid(), :recipient_id);
```

Expected: status='open'; reopen_count incremented; counters back to original.

- [ ] **Step 10.5: Regenerate database.types.ts**

```bash
cd /Users/navesarussi/KC/MVP-2
supabase gen types typescript --project-id <PROJECT_ID> > app/packages/infrastructure-supabase/src/database.types.ts
```

(Use the project ID from `app/apps/mobile/src/lib/supabase.ts` or memory.)

If the local CLI isn't logged in, use the dashboard's "Generate types" feature.

- [ ] **Step 10.6: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: still red (close/reopen/getClosureCandidates impls missing). That's fine — Task 11 fixes.

- [ ] **Step 10.7: Commit**

```bash
git add supabase/migrations/0015_closure_rpcs.sql \
        app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(supabase): closure RPCs (close_post_with_recipient + reopen_post_marked)

0015 — atomic functions for the multi-table closure transitions.
Single-table transitions (close-without-recipient, reopen of
deleted_no_recipient) stay as plain UPDATEs from the client.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Implement closure methods on `SupabasePostRepository`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts`

- [ ] **Step 11.1: Read current file**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts | head -80
```

Note the existing `close`/`reopen` stubs (likely throwing `not_implemented`). Locate them.

- [ ] **Step 11.2: Replace `close` implementation**

Replace the existing `close` method body with:

```ts
async close(postId: string, recipientUserId: string | null): Promise<Post> {
  if (recipientUserId !== null) {
    // Atomic via RPC: insert recipient + flip status.
    const { data, error } = await this.client
      .rpc('close_post_with_recipient', {
        p_post_id: postId,
        p_recipient_user_id: recipientUserId,
      })
      .single();
    if (error) throw mapClosurePgError(error);
    return mapPostRow(data as never);
  }
  // Close without recipient: status → deleted_no_recipient, delete_after = +7d.
  const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await this.client
    .from('posts')
    .update({ status: 'deleted_no_recipient', delete_after: deleteAfter })
    .eq('post_id', postId)
    .select()
    .single();
  if (error) throw mapClosurePgError(error);
  return mapPostRow(data as never);
}
```

- [ ] **Step 11.3: Replace `reopen` implementation**

Replace the existing `reopen` method body with:

```ts
async reopen(postId: string): Promise<Post> {
  // Need to know current status to pick path.
  const { data: current, error: readErr } = await this.client
    .from('posts')
    .select('status')
    .eq('post_id', postId)
    .single();
  if (readErr) throw mapClosurePgError(readErr);

  if (current.status === 'closed_delivered') {
    const { data, error } = await this.client
      .rpc('reopen_post_marked', { p_post_id: postId })
      .single();
    if (error) throw mapClosurePgError(error);
    return mapPostRow(data as never);
  }

  if (current.status === 'deleted_no_recipient') {
    const { data, error } = await this.client
      .from('posts')
      .update({
        status: 'open',
        delete_after: null,
        reopen_count: (await this.fetchReopenCount(postId)) + 1,
      })
      .eq('post_id', postId)
      .select()
      .single();
    if (error) throw mapClosurePgError(error);
    return mapPostRow(data as never);
  }

  throw new PostError('closure_wrong_status', 'closure_wrong_status');
}

private async fetchReopenCount(postId: string): Promise<number> {
  const { data, error } = await this.client
    .from('posts')
    .select('reopen_count')
    .eq('post_id', postId)
    .single();
  if (error) throw mapClosurePgError(error);
  return data.reopen_count ?? 0;
}
```

> Note on `fetchReopenCount`: a tiny race exists between read+update for the rare `deleted_no_recipient → open` reopen path. Acceptable for MVP (the field is informational; FR-CLOSURE-010 suspect-flag is deferred). If we wanted to harden, add a small RPC `reopen_post_unmarked(p_post_id)`. Defer.

- [ ] **Step 11.4: Implement `getClosureCandidates`**

Add as a new method:

```ts
async getClosureCandidates(postId: string): Promise<ClosureCandidate[]> {
  // Distinct partners on chats anchored to this post, sorted by latest message recency.
  // The owner's own row is excluded by the WHERE clause: we look at the `other side`.
  const { data: ownerRow, error: ownerErr } = await this.client
    .from('posts')
    .select('owner_id')
    .eq('post_id', postId)
    .single();
  if (ownerErr) throw mapClosurePgError(ownerErr);
  const ownerId = ownerRow.owner_id as string;

  const { data: chats, error: chatErr } = await this.client
    .from('chats')
    .select('chat_id, user_a, user_b, last_message_at')
    .eq('anchor_post_id', postId);
  if (chatErr) throw mapClosurePgError(chatErr);

  // Map to "other side" + sort by last_message_at desc.
  type ChatRow = { chat_id: string; user_a: string; user_b: string; last_message_at: string | null };
  const partners = new Map<string, string>(); // userId → ISO last_message_at
  for (const c of chats as ChatRow[]) {
    const otherId = c.user_a === ownerId ? c.user_b : c.user_a;
    if (!c.last_message_at) continue;
    const prev = partners.get(otherId);
    if (!prev || prev < c.last_message_at) partners.set(otherId, c.last_message_at);
  }

  if (partners.size === 0) return [];

  const ids = Array.from(partners.keys());
  const { data: users, error: usersErr } = await this.client
    .from('users')
    .select('user_id, full_name, avatar_url, city_id, cities:city_id(name_he)')
    .in('user_id', ids);
  if (usersErr) throw mapClosurePgError(usersErr);

  type UserRow = {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    cities: { name_he: string } | null;
  };
  return (users as UserRow[])
    .map((u) => ({
      userId: u.user_id,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      cityName: u.cities?.name_he ?? null,
      lastMessageAt: partners.get(u.user_id)!,
    }))
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
}
```

> If the `users` table joins to `cities` differently (e.g. a different column name or no `name_he`), adjust by reading `database.types.ts` for the actual relationship. The test should still pass at the use-case layer because that layer uses the fake repo.

- [ ] **Step 11.5: Add error mapper**

At the top of the file, near other error mappers, add:

```ts
import { PostError, type PostErrorCode } from '@kc/application';
import type { PostgrestError } from '@supabase/supabase-js';

const CLOSURE_CODES: ReadonlySet<string> = new Set([
  'closure_not_owner',
  'closure_wrong_status',
  'closure_recipient_not_in_chat',
  'reopen_window_expired',
]);

function mapClosurePgError(error: PostgrestError): PostError {
  const msg = error.message?.trim() ?? '';
  if (CLOSURE_CODES.has(msg)) return new PostError(msg as PostErrorCode, msg, error);
  return new PostError('unknown', error.message ?? 'closure_unknown', error);
}
```

- [ ] **Step 11.6: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: exit 0. (If TS complains about `mapPostRow`, ensure the import is present.)

- [ ] **Step 11.7: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts
git commit -m "feat(supabase): impl close/reopen/getClosureCandidates on SupabasePostRepository

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Implement `dismissClosureExplainer` on `SupabaseUserRepository`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`

- [ ] **Step 12.1: Locate insertion point**

```bash
grep -n "async setBiography\|async setAvatar" /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
```

- [ ] **Step 12.2: Add the method**

Insert near the other user mutation methods (e.g. after `setBiography`):

```ts
async dismissClosureExplainer(userId: string): Promise<void> {
  const { error } = await this.client
    .from('users')
    .update({ closure_explainer_dismissed: true })
    .eq('user_id', userId);
  if (error) throw error;
}
```

- [ ] **Step 12.3: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: exit 0.

- [ ] **Step 12.4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
git commit -m "feat(supabase): impl dismissClosureExplainer on SupabaseUserRepository

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 13: Migration `0016_closure_cleanup_cron.sql`

**Files:**
- Create: `supabase/migrations/0016_closure_cleanup_cron.sql`

> ⚠️ This migration depends on the `pg_cron` extension being enabled in the Supabase project. That requires a one-time click in the Supabase dashboard (Database → Extensions → pg_cron → Enable). The migration creates the schedule but is idempotent and safe to re-run.

- [ ] **Step 13.1: Confirm `pg_cron` is enabled on the dev project**

Open the Supabase dashboard → Database → Extensions → search "pg_cron" → toggle Enable. Done once per environment.

If you cannot toggle it (permission issue), the migration's `cron.schedule` call will fail. In that case, comment out the `cron.schedule` block in the migration and add a TD note for the operator.

- [ ] **Step 13.2: Write the migration**

Create `supabase/migrations/0016_closure_cleanup_cron.sql`:

```sql
-- 0016_closure_cleanup_cron | P0.6 — daily cleanup of unmarked closures (FR-CLOSURE-008)
--
-- After 7 days, posts in `deleted_no_recipient` are hard-deleted along with
-- their media assets. The recipients table cascades on FK; the media_assets
-- table also cascades on posts.post_id. Storage blobs are cleaned up by the
-- AFTER-DELETE trigger via an Edge Function (best-effort; orphans are
-- reconciled by TD-122).

set search_path = public;

-- ── 1. cleanup function ─────────────────────────────────────────────────────
create or replace function public.closure_cleanup_expired()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer;
begin
  with deleted as (
    delete from public.posts
     where status = 'deleted_no_recipient'
       and delete_after is not null
       and delete_after < now()
    returning post_id
  )
  select count(*) into v_deleted_count from deleted;

  raise notice 'closure_cleanup_expired: deleted % posts', v_deleted_count;
  return v_deleted_count;
end;
$$;

grant execute on function public.closure_cleanup_expired() to postgres;

-- ── 2. cron schedule ────────────────────────────────────────────────────────
-- Daily at 04:00 UTC (06:00/07:00 IL depending on DST).
-- pg_cron's schedule names must be unique; use a stable name.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('closure_cleanup_daily')
      where exists (
        select 1 from cron.job where jobname = 'closure_cleanup_daily'
      );
    perform cron.schedule(
      'closure_cleanup_daily',
      '0 4 * * *',
      $sql$ select public.closure_cleanup_expired(); $sql$
    );
  else
    raise notice 'pg_cron extension not enabled — cleanup_daily not scheduled. Enable in dashboard, then re-run this migration.';
  end if;
end$$;

-- ── 3. observability metric ─────────────────────────────────────────────────
-- A simple counter table — incremented by the cleanup function on each run.
-- Read by ops dashboards / TD-122 reconciliation.
create table if not exists public.closure_cleanup_metrics (
  run_at         timestamptz primary key default now(),
  deleted_count  integer not null
);

create or replace function public.closure_cleanup_expired_with_metric()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  v_deleted := public.closure_cleanup_expired();
  insert into public.closure_cleanup_metrics (deleted_count) values (v_deleted);
  return v_deleted;
end;
$$;

-- Repoint the cron to the metric-emitting wrapper.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('closure_cleanup_daily')
      where exists (
        select 1 from cron.job where jobname = 'closure_cleanup_daily'
      );
    perform cron.schedule(
      'closure_cleanup_daily',
      '0 4 * * *',
      $sql$ select public.closure_cleanup_expired_with_metric(); $sql$
    );
  end if;
end$$;

-- end of 0016_closure_cleanup_cron
```

> The migration is intentionally split into two `cron.schedule` blocks so the
> initial schedule still works if the metric table fails to create. Idempotent
> on re-run.

- [ ] **Step 13.3: Apply the migration**

```bash
cd /Users/navesarussi/KC/MVP-2
supabase migration up 0016_closure_cleanup_cron.sql
# or apply via the dashboard SQL editor
```

- [ ] **Step 13.4: Smoke test the cleanup function**

In the SQL editor:

```sql
-- Seed: an old "deleted_no_recipient" post.
update public.posts
   set status = 'deleted_no_recipient',
       delete_after = now() - interval '1 day'
 where post_id = '<some-test-post-id>';

-- Run cleanup.
select public.closure_cleanup_expired_with_metric();
-- Expected: returns 1 (or however many you seeded).

-- Verify deletion.
select post_id, status from public.posts where post_id = '<some-test-post-id>';
-- Expected: 0 rows.

-- Check metric.
select * from public.closure_cleanup_metrics order by run_at desc limit 1;
-- Expected: latest row with deleted_count = 1.
```

- [ ] **Step 13.5: Commit**

```bash
git add supabase/migrations/0016_closure_cleanup_cron.sql
git commit -m "feat(supabase): daily closure cleanup cron (FR-CLOSURE-008)

0016 — pg_cron schedule that hard-deletes deleted_no_recipient posts
past their grace window. Records counts to closure_cleanup_metrics.
Cascades clean recipients + media_assets via existing FKs; Storage
blob orphans tracked under TD-122.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 14: `closureStore` (Zustand)

**Files:**
- Create: `app/apps/mobile/src/store/closureStore.ts`

- [ ] **Step 14.1: Read existing store patterns**

```bash
cat /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/store/filterStore.ts
head -60 /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/store/chatStore.ts
```

Match the existing Zustand idiom (typed state, action functions, selector hooks).

- [ ] **Step 14.2: Read composition root**

```bash
ls /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/composition/ 2>/dev/null
grep -rn "MarkAsDeliveredUseCase\|new SupabasePostRepository\|composition" /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/ 2>&1 | head -10
```

Identify where existing use cases are instantiated. Add closure use cases there.

- [ ] **Step 14.3: Write the store**

Create `app/apps/mobile/src/store/closureStore.ts`:

```ts
/**
 * FR-CLOSURE-001..005 — composition root for the closure flow.
 * Holds: which post is currently being closed, current step, recipient candidates.
 * Actions delegate to use cases.
 */
import { create } from 'zustand';
import type { ClosureCandidate } from '@kc/application';

type ClosureStep = 'idle' | 'confirm' | 'pick' | 'explainer' | 'done' | 'error';

interface ClosureState {
  postId: string | null;
  step: ClosureStep;
  candidates: ClosureCandidate[];
  selectedRecipientId: string | null;
  errorMessage: string | null;
  isBusy: boolean;
}

interface ClosureActions {
  start(postId: string): Promise<void>;
  selectRecipient(userId: string | null): void;
  confirmStep1(): void;
  closeWith(recipientUserId: string | null): Promise<void>;
  dismissExplainer(stayDismissed: boolean): Promise<void>;
  reset(): void;
}

const INITIAL: ClosureState = {
  postId: null,
  step: 'idle',
  candidates: [],
  selectedRecipientId: null,
  errorMessage: null,
  isBusy: false,
};

// Lazy-resolved bindings to use cases (populated from composition root).
type Bindings = {
  markAsDelivered(input: { postId: string; ownerId: string; recipientUserId: string | null }): Promise<unknown>;
  getClosureCandidates(input: { postId: string; ownerId: string }): Promise<ClosureCandidate[]>;
  dismissClosureExplainer(input: { userId: string }): Promise<void>;
  getCurrentUserId(): string | null;
};

let bindings: Bindings | null = null;
export function bindClosureStore(b: Bindings): void {
  bindings = b;
}
function require(): Bindings {
  if (!bindings) throw new Error('closureStore not bound — call bindClosureStore in composition root');
  return bindings;
}

export const useClosureStore = create<ClosureState & ClosureActions>((set, get) => ({
  ...INITIAL,

  async start(postId) {
    const b = require();
    const ownerId = b.getCurrentUserId();
    if (!ownerId) return;
    set({ postId, step: 'confirm', isBusy: true, errorMessage: null });
    try {
      const candidates = await b.getClosureCandidates({ postId, ownerId });
      set({ candidates, isBusy: false });
    } catch (e) {
      set({ step: 'error', isBusy: false, errorMessage: (e as Error).message });
    }
  },

  selectRecipient(userId) {
    set({ selectedRecipientId: userId });
  },

  confirmStep1() {
    set({ step: 'pick' });
  },

  async closeWith(recipientUserId) {
    const b = require();
    const ownerId = b.getCurrentUserId();
    const postId = get().postId;
    if (!ownerId || !postId) return;
    set({ isBusy: true, errorMessage: null });
    try {
      await b.markAsDelivered({ postId, ownerId, recipientUserId });
      set({ step: 'explainer', isBusy: false });
    } catch (e) {
      set({ step: 'error', isBusy: false, errorMessage: (e as Error).message });
    }
  },

  async dismissExplainer(stayDismissed) {
    const b = require();
    const ownerId = b.getCurrentUserId();
    if (stayDismissed && ownerId) {
      try {
        await b.dismissClosureExplainer({ userId: ownerId });
      } catch {
        /* non-blocking — closure still succeeded */
      }
    }
    set({ step: 'done' });
  },

  reset() {
    set(INITIAL);
  },
}));
```

- [ ] **Step 14.4: Verify the file compiles in isolation**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: typecheck failure on the missing binding wiring (next task) — acceptable for now.

- [ ] **Step 14.5: Commit**

```bash
git add app/apps/mobile/src/store/closureStore.ts
git commit -m "feat(closure): closureStore (Zustand) — composition root

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 15: Wire bindings in composition root

**Files:**
- Modify: composition root (path discovered in Task 14.2)

- [ ] **Step 15.1: Locate the existing composition root**

If `app/apps/mobile/src/composition/index.ts` exists, use it. Otherwise look for where `SupabasePostRepository` is instantiated (likely in `_layout.tsx` or a singleton in `lib/`).

- [ ] **Step 15.2: Add the closure bindings**

In the composition root, add (after existing repo + use case wiring):

```ts
import { bindClosureStore } from '../store/closureStore';
import {
  MarkAsDeliveredUseCase,
  GetClosureCandidatesUseCase,
  DismissClosureExplainerUseCase,
  ReopenPostUseCase,
} from '@kc/application';

const markAsDeliveredUC = new MarkAsDeliveredUseCase(postRepo);
const reopenPostUC = new ReopenPostUseCase(postRepo);
const getClosureCandidatesUC = new GetClosureCandidatesUseCase(postRepo, blockRepo);
const dismissClosureExplainerUC = new DismissClosureExplainerUseCase(userRepo);

export { markAsDeliveredUC, reopenPostUC, getClosureCandidatesUC, dismissClosureExplainerUC };

bindClosureStore({
  markAsDelivered: (i) => markAsDeliveredUC.execute(i),
  getClosureCandidates: (i) => getClosureCandidatesUC.execute(i),
  dismissClosureExplainer: (i) => dismissClosureExplainerUC.execute(i),
  getCurrentUserId: () => useAuthStore.getState().user?.userId ?? null,
});
```

(Substitute `useAuthStore` with the actual auth store reference.)

- [ ] **Step 15.3: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 15.4: Commit**

```bash
git add <composition-root-file>
git commit -m "feat(closure): wire use cases in composition root

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 16: `RecipientPickerRow` component

**Files:**
- Create: `app/apps/mobile/src/components/closure/RecipientPickerRow.tsx`

- [ ] **Step 16.1: Read existing row-component patterns**

```bash
ls /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/components/
find /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/components -name "*Row*.tsx" | head -3
```

Pick a similar existing row (chat preview row, follower row) for visual style consistency.

- [ ] **Step 16.2: Implement the row**

Create `app/apps/mobile/src/components/closure/RecipientPickerRow.tsx`:

```tsx
/** FR-CLOSURE-003 AC2: avatar + name + optional city, with selectable radio. */
import { Pressable, Text, View, Image, StyleSheet } from 'react-native';
import type { ClosureCandidate } from '@kc/application';

interface Props {
  candidate: ClosureCandidate;
  selected: boolean;
  onPress: () => void;
}

export function RecipientPickerRow({ candidate, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      {candidate.avatarUrl ? (
        <Image source={{ uri: candidate.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{candidate.fullName[0] ?? '?'}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.name}>{candidate.fullName}</Text>
        {candidate.cityName ? <Text style={styles.city}>{candidate.cityName}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  rowSelected: { backgroundColor: '#f0f7ff' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#1976d2' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1976d2' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '600' },
  text: { flex: 1 },
  name: { fontSize: 16, textAlign: 'right' },
  city: { fontSize: 13, color: '#666', textAlign: 'right' },
});
```

- [ ] **Step 16.3: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 16.4: Commit**

```bash
git add app/apps/mobile/src/components/closure/RecipientPickerRow.tsx
git commit -m "feat(closure): RecipientPickerRow component

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 17: `ClosureSheet` (Step 1 + Step 2 hybrid)

**Files:**
- Create: `app/apps/mobile/src/components/closure/ClosureSheet.tsx`

- [ ] **Step 17.1: Read existing sheet patterns**

```bash
find /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/components -name "*Sheet*.tsx" -o -name "*Modal*.tsx" | head -3
cat /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/components/chat/ReportChatModal.tsx 2>&1 | head -30
```

Match the existing modal/sheet idiom (likely React Native `Modal` with custom backdrop, or `@gorhom/bottom-sheet`).

- [ ] **Step 17.2: Implement the sheet**

Create `app/apps/mobile/src/components/closure/ClosureSheet.tsx`:

```tsx
/** FR-CLOSURE-002 + FR-CLOSURE-003: hybrid Step 1 + Step 2 sheet. */
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useClosureStore } from '../../store/closureStore';
import { RecipientPickerRow } from './RecipientPickerRow';

export function ClosureSheet() {
  const step = useClosureStore((s) => s.step);
  const candidates = useClosureStore((s) => s.candidates);
  const selectedId = useClosureStore((s) => s.selectedRecipientId);
  const isBusy = useClosureStore((s) => s.isBusy);
  const confirmStep1 = useClosureStore((s) => s.confirmStep1);
  const selectRecipient = useClosureStore((s) => s.selectRecipient);
  const closeWith = useClosureStore((s) => s.closeWith);
  const reset = useClosureStore((s) => s.reset);

  const visible = step === 'confirm' || step === 'pick';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <Pressable style={styles.backdrop} onPress={reset}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {step === 'confirm' ? <Step1 onConfirm={confirmStep1} onCancel={reset} /> : null}
          {step === 'pick' ? (
            <Step2
              candidates={candidates}
              selectedId={selectedId}
              isBusy={isBusy}
              onSelect={selectRecipient}
              onMarkAndClose={() => closeWith(selectedId)}
              onCloseWithoutMarking={() => closeWith(null)}
              onCancel={reset}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Step1({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <View>
      <Text style={styles.title}>🤝  האם הפריט באמת נמסר?</Text>
      <Text style={styles.body}>
        חשוב לסמן רק אחרי המסירה הפיזית — לא אחרי תיאום בצ'אט. אם הפריט עדיין לא הגיע ליד מקבל,
        אל תסמן.
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={[styles.btn, styles.btnSecondary]}>
          <Text style={styles.btnSecondaryText}>ביטול</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={[styles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>כן, נמסר ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Step2({
  candidates, selectedId, isBusy, onSelect, onMarkAndClose, onCloseWithoutMarking, onCancel,
}: {
  candidates: ReturnType<typeof useClosureStore>['candidates'] extends infer T ? T : never;
  selectedId: string | null;
  isBusy: boolean;
  onSelect: (id: string | null) => void;
  onMarkAndClose: () => void;
  onCloseWithoutMarking: () => void;
  onCancel: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <View>
        <Text style={styles.title}>🎁  אין למי לסמן</Text>
        <Text style={styles.body}>
          עדיין לא היה צ'אט על הפוסט הזה. אפשר לסגור בלי לסמן מקבל; הפוסט יישמר 7 ימים למקרה
          שטעית, ואז יימחק אוטומטית.
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={[styles.btn, styles.btnSecondary]}>
            <Text style={styles.btnSecondaryText}>ביטול</Text>
          </Pressable>
          <Pressable
            onPress={onCloseWithoutMarking}
            disabled={isBusy}
            style={[styles.btn, styles.btnPrimary, isBusy && styles.btnDisabled]}
          >
            <Text style={styles.btnPrimaryText}>סגור בלי לסמן</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>🎁  למי מסרת את הפריט?</Text>
      <Text style={styles.body}>
        בחר את האדם שקיבל מתוך מי שהיה איתך בצ'אט על הפוסט הזה. אם המקבל לא היה בצ'אט — אפשר
        לסגור בלי לסמן.
      </Text>
      <ScrollView style={styles.list}>
        {candidates.map((c) => (
          <RecipientPickerRow
            key={c.userId}
            candidate={c}
            selected={c.userId === selectedId}
            onPress={() => onSelect(c.userId)}
          />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Pressable
          onPress={onCloseWithoutMarking}
          disabled={isBusy}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>סגור בלי לסמן</Text>
        </Pressable>
        <Pressable
          onPress={onMarkAndClose}
          disabled={!selectedId || isBusy}
          style={[styles.btn, styles.btnPrimary, (!selectedId || isBusy) && styles.btnDisabled]}
        >
          <Text style={styles.btnPrimaryText}>סמן וסגור ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 8 },
  body: { fontSize: 15, color: '#444', textAlign: 'right', marginBottom: 16, lineHeight: 22 },
  list: { maxHeight: 280, marginBottom: 8 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1976d2' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnSecondaryText: { color: '#333', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
```

- [ ] **Step 17.3: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 17.4: Commit**

```bash
git add app/apps/mobile/src/components/closure/ClosureSheet.tsx
git commit -m "feat(closure): ClosureSheet — Step 1+2 hybrid (FR-CLOSURE-002, FR-CLOSURE-003)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 18: `ClosureExplainerSheet` (Step 3)

**Files:**
- Create: `app/apps/mobile/src/components/closure/ClosureExplainerSheet.tsx`

- [ ] **Step 18.1: Implement**

Create `app/apps/mobile/src/components/closure/ClosureExplainerSheet.tsx`:

```tsx
/** FR-CLOSURE-004: one-time explainer with "don't show again" checkbox. */
import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useClosureStore } from '../../store/closureStore';
import { useAuthStore } from '../../store/authStore'; // adjust import path

export function ClosureExplainerSheet() {
  const step = useClosureStore((s) => s.step);
  const dismiss = useClosureStore((s) => s.dismissExplainer);
  const reset = useClosureStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const [stayDismissed, setStayDismissed] = useState(false);

  // Only show if step is 'explainer' AND user hasn't already dismissed forever.
  const visible = step === 'explainer' && user?.closureExplainerDismissed === false;

  // If user already dismissed, fast-forward to done.
  if (step === 'explainer' && user?.closureExplainerDismissed === true) {
    reset();
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <Pressable style={styles.backdrop} onPress={reset}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>✨  תודה שתרמת!</Text>
          <Text style={styles.body}>כך זה עובד:</Text>
          <Text style={styles.bullet}>• פוסטים שסומנו עם מקבל — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל המקבל.</Text>
          <Text style={styles.bullet}>• פוסטים שנסגרו בלי לסמן — נשמרים 7 ימים למקרה של טעות, ואז נמחקים אוטומטית.</Text>
          <Text style={styles.bullet}>• בכל מקרה — "פריטים שתרמתי" שלך עולה ב-1.</Text>

          <Pressable
            onPress={() => setStayDismissed((v) => !v)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, stayDismissed && styles.checkboxChecked]}>
              {stayDismissed ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>אל תציג שוב</Text>
          </Pressable>

          <Pressable
            onPress={() => dismiss(stayDismissed)}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Text style={styles.btnPrimaryText}>הבנתי</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', maxWidth: 440 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  body: { fontSize: 15, color: '#444', textAlign: 'right', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#444', textAlign: 'right', marginBottom: 6, lineHeight: 22 },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginVertical: 16 },
  checkbox: {
    width: 20, height: 20, borderWidth: 2, borderColor: '#999', borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 14, color: '#333' },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1976d2' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
```

> Note: the import path for `useAuthStore` may differ. Adjust to match the project.

- [ ] **Step 18.2: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 18.3: Commit**

```bash
git add app/apps/mobile/src/components/closure/ClosureExplainerSheet.tsx
git commit -m "feat(closure): ClosureExplainerSheet — one-time explainer (FR-CLOSURE-004)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 19: `ReopenConfirmModal`

**Files:**
- Create: `app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx`

- [ ] **Step 19.1: Implement**

Create `app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx`:

```tsx
/** FR-CLOSURE-005 AC2: confirmation modal with two copy variants. */
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface Props {
  visible: boolean;
  variant: 'closed_delivered' | 'deleted_no_recipient';
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReopenConfirmModal({ visible, variant, isBusy, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>📤  לפתוח את הפוסט מחדש?</Text>
          {variant === 'closed_delivered' ? (
            <>
              <Text style={styles.body}>הפוסט יחזור להיות פעיל בפיד.</Text>
              <Text style={styles.bullet}>• הסימון של מי שקיבל יוסר.</Text>
              <Text style={styles.bullet}>• "פריטים שקיבלתי" שלו יקטן ב-1 (בלי התראה).</Text>
              <Text style={styles.bullet}>• "פריטים שתרמתי" שלך יקטן ב-1.</Text>
            </>
          ) : (
            <Text style={styles.body}>הפוסט יחזור להיות פעיל בפיד והוא לא יימחק.</Text>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnSecondaryText}>ביטול</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isBusy}
              style={[styles.btn, styles.btnPrimary, isBusy && styles.btnDisabled]}
            >
              {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>פתח מחדש</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', maxWidth: 440 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  body: { fontSize: 15, color: '#444', textAlign: 'right', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#444', textAlign: 'right', marginBottom: 6, lineHeight: 22 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1976d2' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnSecondaryText: { color: '#333', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
```

- [ ] **Step 19.2: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 19.3: Commit**

```bash
git add app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx
git commit -m "feat(closure): ReopenConfirmModal (FR-CLOSURE-005 AC2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 20: `OwnerActionsBar` + integrate on PostDetail

**Files:**
- Create: `app/apps/mobile/src/components/post-detail/OwnerActionsBar.tsx`
- Modify: `app/apps/mobile/app/post/[id].tsx`

- [ ] **Step 20.1: Read current PostDetail**

```bash
cat /Users/navesarussi/KC/MVP-2/app/apps/mobile/app/post/[id].tsx
```

Locate the existing owner buttons (Edit / Delete). Extract them along with the new closure CTAs into the bar.

- [ ] **Step 20.2: Implement `OwnerActionsBar`**

Create `app/apps/mobile/src/components/post-detail/OwnerActionsBar.tsx`:

```tsx
import { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import type { Post } from '@kc/domain';
import { useClosureStore } from '../../store/closureStore';
import { reopenPostUC } from '../../composition'; // adjust import path
import { ClosureSheet } from '../closure/ClosureSheet';
import { ClosureExplainerSheet } from '../closure/ClosureExplainerSheet';
import { ReopenConfirmModal } from '../closure/ReopenConfirmModal';

interface Props {
  post: Post;
  ownerId: string;
  onEdit: () => void;
  onDelete: () => void;
  onAfterMutation: () => void; // refetch, reset feed, etc.
}

export function OwnerActionsBar({ post, ownerId, onEdit, onDelete, onAfterMutation }: Props) {
  const [reopenOpen, setReopenOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const startClosure = useClosureStore((s) => s.start);
  const closureStep = useClosureStore((s) => s.step);

  // Refetch when the closure flow completes.
  if (closureStep === 'done') {
    useClosureStore.getState().reset();
    onAfterMutation();
  }

  const isOpen = post.status === 'open';
  const isReopenable =
    post.status === 'closed_delivered' ||
    (post.status === 'deleted_no_recipient' &&
      post.deleteAfter !== null &&
      new Date(post.deleteAfter).getTime() > Date.now());

  async function handleReopen() {
    setIsReopening(true);
    try {
      await reopenPostUC.execute({ postId: post.postId, ownerId });
      setReopenOpen(false);
      onAfterMutation();
    } catch (e) {
      Alert.alert('שגיאה', (e as Error).message);
    } finally {
      setIsReopening(false);
    }
  }

  return (
    <>
      <View style={styles.bar}>
        {isOpen ? (
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => startClosure(post.postId)}
          >
            <Text style={styles.btnPrimaryText}>סמן כנמסר ✓</Text>
          </Pressable>
        ) : null}
        {isReopenable ? (
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => setReopenOpen(true)}
          >
            <Text style={styles.btnPrimaryText}>📤 פתח מחדש</Text>
          </Pressable>
        ) : null}
        {isOpen ? (
          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onEdit}>
            <Text style={styles.btnSecondaryText}>ערוך</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.btn, styles.btnDanger]} onPress={onDelete}>
          <Text style={styles.btnDangerText}>מחק</Text>
        </Pressable>
      </View>

      <ClosureSheet />
      <ClosureExplainerSheet />
      <ReopenConfirmModal
        visible={reopenOpen}
        variant={post.status === 'closed_delivered' ? 'closed_delivered' : 'deleted_no_recipient'}
        isBusy={isReopening}
        onCancel={() => setReopenOpen(false)}
        onConfirm={handleReopen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row-reverse', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1976d2' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnSecondaryText: { color: '#333', fontSize: 15, fontWeight: '600' },
  btnDanger: { backgroundColor: '#fce4e4' },
  btnDangerText: { color: '#c62828', fontSize: 15, fontWeight: '600' },
});
```

> Adjust the import for `reopenPostUC` to the actual composition root export path.

- [ ] **Step 20.3: Update `post/[id].tsx`**

Replace the existing owner buttons block in `post/[id].tsx` with:

```tsx
{isOwner ? (
  <OwnerActionsBar
    post={post}
    ownerId={user.userId}
    onEdit={() => router.push(`/post/${post.postId}/edit`)}
    onDelete={handleDelete}
    onAfterMutation={() => myPostsQuery.refetch()}
  />
) : null}
```

(Match local naming for `isOwner`, `handleDelete`, `myPostsQuery`.)

- [ ] **Step 20.4: Verify typecheck + LOC cap**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
pnpm --filter @kc/mobile lint:arch 2>&1 | tail -10
```

Expected: typecheck 0; lint:arch may flag `OwnerActionsBar.tsx` near 200 LOC. If under cap, OK.

- [ ] **Step 20.5: Commit**

```bash
git add app/apps/mobile/src/components/post-detail/OwnerActionsBar.tsx \
        app/apps/mobile/app/post/[id].tsx
git commit -m "feat(closure): wire CTAs on PostDetail via OwnerActionsBar (FR-CLOSURE-001, FR-CLOSURE-005 AC1)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 21: `(tabs)/profile.tsx` — closed tab covers `deleted_no_recipient`

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 21.1: Update the status filter**

In `profile.tsx`, change line 42 area from:

```ts
status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
```

to:

```ts
status: activeTab === 'open' ? ['open'] : ['closed_delivered', 'deleted_no_recipient'],
```

- [ ] **Step 21.2: Add per-row "Reopen" badge / hint (optional polish)**

If time permits — show a small tag on closed posts indicating their state ("סומן" / "יימחק עוד X ימים"). Otherwise leave as-is.

For the "X ימים" calculation:

```ts
function daysUntilDelete(deleteAfter: string | null): number | null {
  if (!deleteAfter) return null;
  const ms = new Date(deleteAfter).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}
```

- [ ] **Step 21.3: Verify typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile typecheck
```

Expected: exit 0.

- [ ] **Step 21.4: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(closure): include deleted_no_recipient in 'closed' tab on profile

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 22: Manual verification (Web preview)

> No unit tests for UI. Visual verification per `feedback_verify_ui_before_claiming_done` memory.

- [ ] **Step 22.1: Start the web dev server**

Use the `preview_start` tool (or the project's existing preview workflow per memory `dev_preview_url`):

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile web
```

Wait for "web compiled successfully".

- [ ] **Step 22.2: Sign in as the super-admin test account**

Use credentials from memory `super_admin_test_account.md`. This user already has at least one post and at least one chat partner, making testing fast.

- [ ] **Step 22.3: Walk the happy path — close with recipient**

Navigate to the user's "My Posts" → open an `open` post → tap "סמן כנמסר ✓".
- Verify Step 1 sheet appears with the right copy.
- Tap "כן, נמסר ✓".
- Verify Step 2 shows the chat partners list (or empty state if none).
- Pick a recipient → tap "סמן וסגור ✓".
- Verify Step 3 (explainer) appears (first time only).
- Check "אל תציג שוב" → tap "הבנתי".
- Verify the post now shows "📤 פתח מחדש" instead of "סמן כנמסר".
- Navigate to profile → verify "פריטים שתרמתי" went up by 1.

- [ ] **Step 22.4: Walk the close-without-marking path**

- Open another `open` post that has no chat partners.
- Tap "סמן כנמסר ✓" → "כן, נמסר ✓" → verify empty state.
- Tap "סגור בלי לסמן" → verify post becomes `deleted_no_recipient`.
- The explainer should NOT show again (already dismissed).
- Verify post appears in "סגורים" tab on profile with "פתח מחדש" available.

- [ ] **Step 22.5: Walk the reopen path**

- Open the closed post from 22.3 → tap "📤 פתח מחדש".
- Verify the modal shows the closed-delivered variant (3 bullets).
- Tap "פתח מחדש" → verify post returns to `open` and reopen_count incremented.
- Profile counter should drop back by 1.

- [ ] **Step 22.6: Walk the reopen-unmarked path**

- Open the closed-without-marking post from 22.4 → tap "📤 פתח מחדש".
- Verify the modal shows the unmarked variant (one-line copy).
- Tap "פתח מחדש" → verify post returns to `open`.

- [ ] **Step 22.7: Inspect console for errors**

Use `preview_console_logs`. Expected: zero red errors. Yellow warnings may exist (existing).

- [ ] **Step 22.8: Capture screenshots for the PR**

Use `preview_screenshot` for: closed post detail with reopen CTA, Step 1, Step 2 with picker, Step 3 explainer, reopen confirm modal, profile with counters.

Save to `/tmp/closure-screenshots/` for embedding in the PR description.

- [ ] **Step 22.9: Stop dev server**

`preview_stop` (the tool will reclaim the slot).

---

## Task 23: SSOT updates

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/HISTORY.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/OPERATOR_RUNBOOK.md`

- [ ] **Step 23.1: Update `PROJECT_STATUS.md`**

- Set `Last Updated` to today's date with a one-line summary of P0.6.
- Move P0.5 → 🟢 Done (it was already done in git; doc was stale).
- Move P0.6 → 🟡 In progress (now) → 🟢 Done (after PR merges).
- Update the "What works end-to-end" and "What is in flight" sections.
- Update Sprint Board: P0.6 → "Most recently shipped".
- Update §1 metrics: features done +1, P0 critical features remaining = 0 (all P0 shipped).
- Add EXEC entry to §4 if any new decision crystallized.

- [ ] **Step 23.2: Append to `HISTORY.md`** (top of file)

```markdown
### P0.6 — Closure flow (FR-CLOSURE-001..005, 008, 009 verified) — 2026-05-10

- **SRS**: FR-CLOSURE-001..005 (initiate, Step 1 confirm, Step 2 picker with/without, Step 3 one-time explainer, reopen).
- **SRS (infra)**: FR-CLOSURE-008 (daily pg_cron cleanup of expired `deleted_no_recipient`).
- **SRS (verified)**: FR-CLOSURE-009 (stat projections via 0006 triggers — items_given_count + items_received_count move correctly on every closure transition).
- **Branch / PR**: feat/FR-CLOSURE-001-closure-flow / PR #__.
- **Tests**: +17 vitest (4 new use cases). Total ~96 passing.
- **Tech-debt deltas**: +TD-119 (notify recipient on mark — depends on FR-NOTIF push), +TD-120 (recipient un-marks self), +TD-121 (suspect flag at 5+ reopens — depends on FR-MOD-008), +TD-122 (storage orphan reconciliation), +TD-123 (telemetry events). No closures.
- **Open gaps**: FR-CLOSURE-006/007/010 deferred per spec; storage orphan blobs are best-effort cleanup until TD-122 lands.
```

- [ ] **Step 23.3: Append to `TECH_DEBT.md`** (active section, FE/BE lanes as appropriate)

```markdown
| TD-119 | 🟠 | **Notify recipient on mark.** FR-CLOSURE-006 — Critical-category notification ("[Owner] sammen you as the receiver of [post]") is not delivered. Currently the recipient sees the mark passively when they next view the post. Depends on FR-NOTIF-001..006 (P1.5). | P1.5 |
| TD-120 | 🟠 | **Recipient un-marks self.** FR-CLOSURE-007 — recipient cannot remove their own credit. UI absent; use case absent. | P2.x |
| TD-121 | 🟠 | **Suspect flag at 5+ reopens.** FR-CLOSURE-010 — `posts.reopen_count` is incremented on every reopen, but no moderation queue entry is created. Depends on FR-MOD-008 (P1.3). | P1.3 |
| TD-122 | 🟠 | **Storage orphan reconciliation.** When `closure_cleanup_expired` deletes a `deleted_no_recipient` post, the FK cascade removes `media_assets` rows but the actual blobs in the `post-images` bucket are not deleted. Build a daily reconciliation Edge Function that lists bucket contents and removes objects whose owning post no longer exists. | Maintenance |
| TD-123 | 🟢 | **Closure telemetry events.** FR-CLOSURE-002 AC3 specifies a `closure_step1_completed` event. No telemetry infra exists in the repo. Defer until analytics is set up. | Analytics |
```

(Use the next free FE TD ID range per CLAUDE.md: 100-149.)

- [ ] **Step 23.4: Add operator runbook section**

Append to `docs/OPERATOR_RUNBOOK.md`:

```markdown
### Enable `pg_cron` extension (one-time, P0.6)

P0.6 closure flow ships a daily cron that hard-deletes `deleted_no_recipient`
posts past their grace window (FR-CLOSURE-008). The migration `0016_closure_cleanup_cron.sql`
is idempotent and safe to re-run, but it depends on the `pg_cron` extension
being enabled on the project.

Steps:
1. Open the Supabase dashboard for the dev project.
2. Database → Extensions → search "pg_cron" → toggle Enable.
3. Re-run `supabase migration up 0016_closure_cleanup_cron.sql` (or apply via SQL editor).
4. Verify: `select * from cron.job where jobname = 'closure_cleanup_daily';` should return one row.

Repeat for staging/prod when promoting.
```

- [ ] **Step 23.5: Verify documentation lints (if any)**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile lint:arch
```

Expected: exit 0.

- [ ] **Step 23.6: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md \
        docs/SSOT/HISTORY.md \
        docs/SSOT/TECH_DEBT.md \
        docs/OPERATOR_RUNBOOK.md
git commit -m "docs(ssot): P0.6 closure flow shipped — status, history, tech-debt, runbook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 24: PR

- [ ] **Step 24.1: Push branch**

```bash
git push -u origin feat/FR-CLOSURE-001-closure-flow
```

- [ ] **Step 24.2: Open PR**

```bash
gh pr create --title "feat(P0.6): closure flow (FR-CLOSURE-001..005, 008, 009)" --body "$(cat <<'EOF'
## Summary

- Mark-as-delivered flow with three steps: confirm → recipient picker → one-time explainer.
- Reopen flow for both closed_delivered and deleted_no_recipient (within grace).
- Daily pg_cron job hard-deletes expired unmarked closures (FR-CLOSURE-008).
- Verified that existing 0006 stat-projection triggers fire correctly on every transition (FR-CLOSURE-009).

## Test plan

- [ ] Vitest: ~17 new tests pass (`pnpm --filter @kc/application test`).
- [ ] Web preview: walk happy path (close with recipient → see counter +1).
- [ ] Web preview: walk close-without-marking → see post in 'closed' tab → "פתח מחדש".
- [ ] Web preview: reopen → counter back to original.
- [ ] SQL smoke: seed an expired `deleted_no_recipient`, run `closure_cleanup_expired_with_metric()`, verify hard delete.

## Out of scope (TDs)

- TD-119: notify recipient on mark (FR-CLOSURE-006, depends on push)
- TD-120: recipient un-marks self (FR-CLOSURE-007)
- TD-121: suspect flag at 5+ reopens (FR-CLOSURE-010, depends on FR-MOD-008)
- TD-122: storage orphan reconciliation
- TD-123: closure telemetry events

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 24.3: Watch CI**

```bash
gh pr checks --watch
```

If green: auto-merge per `git-workflow.mdc`. If red: investigate, fix, push.

- [ ] **Step 24.4: After merge — final SSOT touch-up**

After auto-merge, edit `PROJECT_STATUS.md` once more to:
- Move P0.6 from 🟡 → 🟢.
- Update Sprint Board "Most recently shipped".

Push to main as a docs-only commit if needed (or amend the doc commit pre-merge so it lands together).

---

## Self-Review

Spec coverage check:

| FR | Task |
|----|------|
| FR-CLOSURE-001 (initiate) | Task 20 (CTA on PostDetail) |
| FR-CLOSURE-002 (Step 1 confirm) | Task 17 (ClosureSheet — `Step1` component) |
| FR-CLOSURE-003 (Step 2 picker) | Task 17 (`Step2`) + Task 16 (RecipientPickerRow) + Task 7 (use case for filtering) |
| FR-CLOSURE-004 (Step 3 explainer) | Task 18 (ClosureExplainerSheet) + Task 8 (use case for dismiss) |
| FR-CLOSURE-005 (reopen) | Task 6 (use case) + Task 19 (modal) + Task 20 (wiring) |
| FR-CLOSURE-008 (cleanup cron) | Task 13 (migration 0016) |
| FR-CLOSURE-009 (stat triggers) | Verified pre-existing in 0006; smoke test in Task 10.4 + Task 22.3 |

Placeholder scan: no `TBD` / `TODO` / "implement later" / "similar to Task N". One typo fixed in spec (`yatomot` → `יתומות`).

Type consistency: `ClosureCandidate` defined in Task 2, used in Tasks 4, 7, 11, 14, 16, 17. `MarkAsDeliveredInput` defined in Task 5; used in Task 14 (via `markAsDelivered` binding), Task 15. Naming consistent.

Single PR, single agent — no decomposition needed.

---

## Execution

I will execute this plan inline in the current session, using bite-sized step granularity. Verification at the end of each task; full manual UI verification at Task 22 before opening the PR.
