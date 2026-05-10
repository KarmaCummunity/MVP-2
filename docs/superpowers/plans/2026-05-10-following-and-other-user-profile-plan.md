# Following + Other-User Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full follow mechanism (FR-FOLLOW-001..009, 011, 012) and rebuild the other-user profile screen (FR-PROFILE-002..006, 009, 010) on top of the existing DB schema (migration 0003).

**Architecture:** Approach B from the spec — two screens (`(tabs)/profile.tsx` and `/user/[handle]/index.tsx`) sharing six subcomponents under `apps/mobile/src/components/profile/`. 12 new use cases under `packages/application/src/follow/`. Existing `IUserRepository` follow methods (currently `NOT_IMPL`) gain real implementations in `SupabaseUserRepository`. Zero DB changes.

**Tech Stack:** TypeScript · Vitest · Expo Router 6 · React Native · React Query · Supabase JS client · Zustand · pnpm + turbo monorepo.

**Spec:** [`docs/superpowers/specs/2026-05-10-following-and-other-user-profile-design.md`](../specs/2026-05-10-following-and-other-user-profile-design.md)

---

## Conventions (read once)

- **Working dir:** monorepo root is `app/`. Run all `pnpm` from `app/`.
- **Branch:** stay on the current worktree branch. One commit per task minimum.
- **Test runner:** `pnpm --filter @kc/application test -- <pattern>` for vitest.
- **Typecheck:** `pnpm typecheck` from `app/`. Must stay green after every task.
- **File-size cap:** 200 LOC per `.cursor/rules/srs-architecture.mdc`. If a task pushes a file over, split it as part of the same task.
- **Hebrew copy:** all user-facing text in Hebrew. Code identifiers + log strings in English.
- **Dependency injection:** use cases take ports via constructor; tests inject fakes.
- **Test naming:** `describe('<UseCaseName>')` + `it('<behavior>')`. Mirror posts/__tests__ patterns.
- **Verification gate:** every commit body begins with `Mapped to SRS: <FR-IDs>. Refactor logged: No.` per CLAUDE.md.

---

## File Structure (locked at planning time)

### Created

```
app/packages/application/src/follow/
├── errors.ts                          # FollowError + codes
├── types.ts                           # FollowState, FollowRequestWithUser
├── FollowUserUseCase.ts
├── UnfollowUserUseCase.ts
├── SendFollowRequestUseCase.ts
├── CancelFollowRequestUseCase.ts
├── AcceptFollowRequestUseCase.ts
├── RejectFollowRequestUseCase.ts
├── RemoveFollowerUseCase.ts
├── ListFollowersUseCase.ts
├── ListFollowingUseCase.ts
├── ListPendingFollowRequestsUseCase.ts
├── GetFollowStateUseCase.ts
├── UpdatePrivacyModeUseCase.ts
└── __tests__/
    ├── FakeUserRepository.ts
    ├── FollowUserUseCase.test.ts
    ├── UnfollowUserUseCase.test.ts
    ├── SendFollowRequestUseCase.test.ts
    ├── CancelFollowRequestUseCase.test.ts
    ├── AcceptFollowRequestUseCase.test.ts
    ├── RejectFollowRequestUseCase.test.ts
    ├── RemoveFollowerUseCase.test.ts
    ├── ListFollowersUseCase.test.ts
    ├── ListFollowingUseCase.test.ts
    ├── ListPendingFollowRequestsUseCase.test.ts
    ├── GetFollowStateUseCase.test.ts
    └── UpdatePrivacyModeUseCase.test.ts

app/packages/infrastructure-supabase/src/users/follow/
├── mapFollowError.ts
├── followMethods.ts                   # follow / unfollow / isFollowing / list
├── followRequestMethods.ts            # send / cancel / accept / reject / pending
└── getFollowState.ts                  # joined state probe

app/apps/mobile/src/components/profile/
├── ProfileHeader.tsx
├── ProfileStatsRow.tsx
├── ProfileTabs.tsx
├── ProfilePostsGrid.tsx
├── FollowButton.tsx
└── LockedPanel.tsx

app/apps/mobile/app/user/[handle]/
├── _layout.tsx
├── index.tsx                          # replaces user/[handle].tsx
├── followers.tsx
└── following.tsx

app/apps/mobile/app/settings/
├── index.tsx
├── privacy.tsx
└── follow-requests.tsx

app/apps/mobile/src/services/
└── followComposition.ts               # use case wiring (mirrors postsComposition.ts)
```

### Modified

```
app/packages/application/src/index.ts                   # export new symbols
app/packages/application/src/ports/IUserRepository.ts   # add setPrivacyMode
app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts  # implement NOT_IMPLs + setPrivacyMode
app/apps/mobile/app/(tabs)/profile.tsx                  # refactor to use shared subcomponents
app/apps/mobile/src/lib/container.ts                    # if applicable, register follow use cases
docs/SSOT/SRS/02_functional_requirements/02_profile_and_privacy.md  # AC2 + AC4 update
docs/SSOT/SRS/appendices/C_decisions_log.md             # EXEC-7 entry
docs/SSOT/PROJECT_STATUS.md                             # snapshot + sprint board
docs/SSOT/TECH_DEBT.md                                  # close TD-14, TD-40 partial; open TD-124
docs/SSOT/HISTORY.md                                    # P1.1 entry on top
```

### Deleted

```
app/apps/mobile/app/user/[handle].tsx     # superseded by user/[handle]/index.tsx
```

---

## Phase A — Application Layer (no UI dependency)

### Task 1: Application errors + types

**Files:**
- Create: `app/packages/application/src/follow/errors.ts`
- Create: `app/packages/application/src/follow/types.ts`

- [ ] **Step 1: Create `errors.ts`**

```ts
// app/packages/application/src/follow/errors.ts
// Follow-domain orchestration errors. Mirrors posts/errors.ts.
// Mapped to SRS: FR-FOLLOW-001..009, 011.

export type FollowErrorCode =
  | 'self_follow'
  | 'blocked_relationship'
  | 'already_following'
  | 'cooldown_active'
  | 'pending_request_exists'
  | 'user_not_found'
  | 'privacy_mode_no_change'
  | 'unknown';

export class FollowError extends Error {
  readonly code: FollowErrorCode;
  /** ISO-8601 cooldown_until from DB; only present when code === 'cooldown_active'. */
  readonly cooldownUntil?: string;
  readonly cause?: unknown;

  constructor(
    code: FollowErrorCode,
    message: string,
    opts: { cooldownUntil?: string; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'FollowError';
    this.code = code;
    this.cooldownUntil = opts.cooldownUntil;
    this.cause = opts.cause;
  }
}

export function isFollowError(value: unknown): value is FollowError {
  return value instanceof FollowError;
}
```

- [ ] **Step 2: Create `types.ts`**

```ts
// app/packages/application/src/follow/types.ts
// Shared follow-feature types for use-case I/O.
// Mapped to SRS: FR-FOLLOW-011 (state machine), FR-FOLLOW-007 (pending list).

import type { FollowRequest, User } from '@kc/domain';

/** Five UI states from FR-FOLLOW-011 + viewer-is-self + blocked. */
export type FollowState =
  | 'self'
  | 'not_following_public'
  | 'following'
  | 'not_following_private_no_request'
  | 'request_pending'
  | 'cooldown_after_reject'
  | 'blocked';

export interface FollowStateInfo {
  state: FollowState;
  /** ISO-8601, present only when state === 'cooldown_after_reject'. */
  cooldownUntil?: string;
}

/** Pending-request row joined with the requester's User profile (FR-FOLLOW-007 AC2). */
export interface FollowRequestWithUser {
  request: FollowRequest;
  requester: User;
}

export interface PaginatedUsers {
  users: User[];
  nextCursor: string | null;
}

export interface PaginatedRequests {
  requests: FollowRequestWithUser[];
  nextCursor: string | null;
}
```

- [ ] **Step 3: Add to barrel exports**

Modify `app/packages/application/src/index.ts` — append at the end:

```ts
// Follow use cases (P1.1)
export * from './follow/errors';
export * from './follow/types';
```

(More follow exports will be added as use cases are written.)

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: `Tasks: ... successful`

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/follow/errors.ts \
        app/packages/application/src/follow/types.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): scaffold FollowError + FollowState types (P1.1)

Mapped to SRS: FR-FOLLOW-011, FR-FOLLOW-007. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: FakeUserRepository for follow tests

**Files:**
- Create: `app/packages/application/src/follow/__tests__/FakeUserRepository.ts`

- [ ] **Step 1: Create the fake**

```ts
// app/packages/application/src/follow/__tests__/FakeUserRepository.ts
// In-memory IUserRepository slice for follow use-case tests. Captures the last
// call to each follow-related method so tests can assert on what the use case
// forwarded. Methods unrelated to follow are stubbed to throw.

import type {
  AuthIdentity,
  Block,
  FollowEdge,
  FollowRequest,
  OnboardingState,
  PrivacyMode,
  User,
} from '@kc/domain';
import type { IUserRepository } from '../../ports/IUserRepository';

const N = (m: string) => () => Promise.reject(new Error(`fake.${m}: not_used_in_test`));

export interface FakeUserRepoStub {
  followers?: User[];
  following?: User[];
  pendingRequests?: FollowRequest[];
  isFollowing?: boolean;
  user?: User | null;
  setPrivacyModeResult?: User;
}

export class FakeUserRepository implements IUserRepository {
  // Captures
  lastFollow: { followerId: string; followedId: string } | null = null;
  lastUnfollow: { followerId: string; followedId: string } | null = null;
  lastSendRequest: { requesterId: string; targetId: string } | null = null;
  lastCancelRequest: { requesterId: string; targetId: string } | null = null;
  lastAcceptRequest: { requesterId: string; targetId: string } | null = null;
  lastRejectRequest: { requesterId: string; targetId: string } | null = null;
  lastSetPrivacyMode: { userId: string; mode: PrivacyMode } | null = null;
  lastGetFollowers: { userId: string; limit: number; cursor?: string } | null = null;
  lastGetFollowing: { userId: string; limit: number; cursor?: string } | null = null;
  lastGetPendingRequests: { userId: string } | null = null;

  // Stubs
  followers: User[] = [];
  following: User[] = [];
  pendingRequests: FollowRequest[] = [];
  isFollowingResult = false;
  user: User | null = null;
  followError: Error | null = null;
  sendRequestError: Error | null = null;
  setPrivacyModeError: Error | null = null;
  setPrivacyModeResult: User | null = null;

  // ── Follow methods ────────────────────────────────────────────────────
  async follow(followerId: string, followedId: string): Promise<FollowEdge> {
    this.lastFollow = { followerId, followedId };
    if (this.followError) throw this.followError;
    return { followerId, followedId, createdAt: new Date().toISOString() };
  }
  async unfollow(followerId: string, followedId: string): Promise<void> {
    this.lastUnfollow = { followerId, followedId };
  }
  async isFollowing(): Promise<boolean> {
    return this.isFollowingResult;
  }
  async getFollowers(userId: string, limit: number, cursor?: string): Promise<User[]> {
    this.lastGetFollowers = { userId, limit, cursor };
    return this.followers;
  }
  async getFollowing(userId: string, limit: number, cursor?: string): Promise<User[]> {
    this.lastGetFollowing = { userId, limit, cursor };
    return this.following;
  }
  async sendFollowRequest(requesterId: string, targetId: string): Promise<FollowRequest> {
    this.lastSendRequest = { requesterId, targetId };
    if (this.sendRequestError) throw this.sendRequestError;
    return {
      requesterId,
      targetId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      cooldownUntil: null,
    };
  }
  async cancelFollowRequest(requesterId: string, targetId: string): Promise<void> {
    this.lastCancelRequest = { requesterId, targetId };
  }
  async acceptFollowRequest(requesterId: string, targetId: string): Promise<void> {
    this.lastAcceptRequest = { requesterId, targetId };
  }
  async rejectFollowRequest(requesterId: string, targetId: string): Promise<void> {
    this.lastRejectRequest = { requesterId, targetId };
  }
  async getPendingFollowRequests(userId: string): Promise<FollowRequest[]> {
    this.lastGetPendingRequests = { userId };
    return this.pendingRequests;
  }

  // ── User read methods used by follow use cases ────────────────────────
  async findById(): Promise<User | null> {
    return this.user;
  }
  async findByHandle(): Promise<User | null> {
    return this.user;
  }
  async setPrivacyMode(userId: string, mode: PrivacyMode): Promise<User> {
    this.lastSetPrivacyMode = { userId, mode };
    if (this.setPrivacyModeError) throw this.setPrivacyModeError;
    if (!this.setPrivacyModeResult) throw new Error('fake.setPrivacyMode: stub missing');
    return this.setPrivacyModeResult;
  }

  // ── Unused — throw to keep tests honest ───────────────────────────────
  getOnboardingState = N('getOnboardingState') as IUserRepository['getOnboardingState'];
  setBasicInfo = N('setBasicInfo') as IUserRepository['setBasicInfo'];
  setOnboardingState = N('setOnboardingState') as IUserRepository['setOnboardingState'];
  setAvatar = N('setAvatar') as IUserRepository['setAvatar'];
  setBiography = N('setBiography') as IUserRepository['setBiography'];
  dismissClosureExplainer = N('dismissClosureExplainer') as IUserRepository['dismissClosureExplainer'];
  getEditableProfile = N('getEditableProfile') as IUserRepository['getEditableProfile'];
  searchUsers = N('searchUsers') as IUserRepository['searchUsers'];
  create = N('create') as IUserRepository['create'];
  update = N('update') as IUserRepository['update'];
  delete = N('delete') as IUserRepository['delete'];
  block = N('block') as IUserRepository['block'];
  unblock = N('unblock') as IUserRepository['unblock'];
  getBlockedUsers = N('getBlockedUsers') as IUserRepository['getBlockedUsers'];
  isBlocked = N('isBlocked') as IUserRepository['isBlocked'];
  findByAuthIdentity = N('findByAuthIdentity') as IUserRepository['findByAuthIdentity'];
  createAuthIdentity = N('createAuthIdentity') as IUserRepository['createAuthIdentity'];
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    userId: 'u_test',
    authProvider: 'email',
    shareHandle: 'tester',
    displayName: 'Tester',
    city: 'tlv',
    cityName: 'תל אביב',
    biography: null,
    avatarUrl: null,
    privacyMode: 'Public',
    privacyChangedAt: null,
    accountStatus: 'active',
    onboardingState: 'completed',
    notificationPreferences: { Critical: true, Social: true },
    isSuperAdmin: false,
    closureExplainerDismissed: false,
    firstPostNudgeDismissed: false,
    itemsGivenCount: 0,
    itemsReceivedCount: 0,
    activePostsCountInternal: 0,
    followersCount: 0,
    followingCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
```

- [ ] **Step 2: Add `setPrivacyMode` to `IUserRepository`**

Modify `app/packages/application/src/ports/IUserRepository.ts` — insert after the `setBiography` method (around line 38, before `dismissClosureExplainer`):

```ts
  /**
   * FR-PROFILE-005, 006 — flips users.privacy_mode and stamps privacy_changed_at.
   * Returns the updated User. Idempotent at the DB layer; the use case prevents
   * pointless writes when the mode is unchanged.
   */
  setPrivacyMode(userId: string, mode: import('@kc/domain').PrivacyMode): Promise<User>;
```

- [ ] **Step 3: Add `setPrivacyMode` stub to `SupabaseUserRepository`**

Modify `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` — insert after `setBiography` (around line 71):

```ts
  async setPrivacyMode(_userId: string, _mode: import('@kc/domain').PrivacyMode): Promise<User> {
    throw NOT_IMPL('setPrivacyMode', 'P1.1');
  }
```

(Real implementation comes in Task 11.)

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/ports/IUserRepository.ts \
        app/packages/application/src/follow/__tests__/FakeUserRepository.ts \
        app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
git commit -m "$(cat <<'EOF'
feat(follow): FakeUserRepository + setPrivacyMode port (P1.1)

Mapped to SRS: FR-PROFILE-005, FR-PROFILE-006. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: FollowUserUseCase + UnfollowUserUseCase

**Files:**
- Create: `app/packages/application/src/follow/FollowUserUseCase.ts`
- Create: `app/packages/application/src/follow/UnfollowUserUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/FollowUserUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/UnfollowUserUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test for FollowUserUseCase**

```ts
// app/packages/application/src/follow/__tests__/FollowUserUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { FollowUserUseCase } from '../FollowUserUseCase';
import { FakeUserRepository } from './FakeUserRepository';
import { FollowError } from '../errors';

describe('FollowUserUseCase', () => {
  it('forwards (followerId, followedId) to the repo and returns the edge', async () => {
    const repo = new FakeUserRepository();
    const uc = new FollowUserUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastFollow).toEqual({ followerId: 'u_a', followedId: 'u_b' });
    expect(out.edge.followerId).toBe('u_a');
    expect(out.edge.followedId).toBe('u_b');
  });

  it('rejects self-follow before hitting the repo', async () => {
    const repo = new FakeUserRepository();
    const uc = new FollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
    expect(repo.lastFollow).toBeNull();
  });

  it('treats already_following as success (idempotent)', async () => {
    const repo = new FakeUserRepository();
    repo.followError = new FollowError('already_following', 'already_following');
    const uc = new FollowUserUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.edge.followerId).toBe('u_a');
  });

  it('propagates blocked_relationship', async () => {
    const repo = new FakeUserRepository();
    repo.followError = new FollowError('blocked_relationship', 'blocked_relationship');
    const uc = new FollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'blocked_relationship' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @kc/application test -- FollowUserUseCase`
Expected: FAIL with "Cannot find module '../FollowUserUseCase'".

- [ ] **Step 3: Implement FollowUserUseCase**

```ts
// app/packages/application/src/follow/FollowUserUseCase.ts
/** FR-FOLLOW-001 — instant follow on a Public profile (or after request approval). */
import type { FollowEdge } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError, isFollowError } from './errors';

export interface FollowUserInput {
  viewerId: string;
  targetUserId: string;
}

export interface FollowUserOutput {
  edge: FollowEdge;
}

export class FollowUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: FollowUserInput): Promise<FollowUserOutput> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    try {
      const edge = await this.users.follow(input.viewerId, input.targetUserId);
      return { edge };
    } catch (err) {
      // FR-FOLLOW-001 AC1 — idempotent on retry.
      if (isFollowError(err) && err.code === 'already_following') {
        return {
          edge: {
            followerId: input.viewerId,
            followedId: input.targetUserId,
            createdAt: new Date().toISOString(),
          },
        };
      }
      throw err;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @kc/application test -- FollowUserUseCase`
Expected: PASS (4 tests).

- [ ] **Step 5: Write failing test for UnfollowUserUseCase**

```ts
// app/packages/application/src/follow/__tests__/UnfollowUserUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { UnfollowUserUseCase } from '../UnfollowUserUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('UnfollowUserUseCase', () => {
  it('forwards to repo and returns void', async () => {
    const repo = new FakeUserRepository();
    const uc = new UnfollowUserUseCase(repo);

    await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastUnfollow).toEqual({ followerId: 'u_a', followedId: 'u_b' });
  });

  it('rejects self-unfollow defensively', async () => {
    const repo = new FakeUserRepository();
    const uc = new UnfollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
```

- [ ] **Step 6: Implement UnfollowUserUseCase**

```ts
// app/packages/application/src/follow/UnfollowUserUseCase.ts
/** FR-FOLLOW-002 — hard-delete the FollowEdge. No notification on the way out. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface UnfollowUserInput {
  viewerId: string;
  targetUserId: string;
}

export class UnfollowUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UnfollowUserInput): Promise<void> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.unfollow(input.viewerId, input.targetUserId);
  }
}
```

- [ ] **Step 7: Run all follow tests**

Run: `pnpm --filter @kc/application test -- follow`
Expected: PASS (6 tests).

- [ ] **Step 8: Add exports**

Modify `app/packages/application/src/index.ts` — under the `// Follow use cases (P1.1)` comment block:

```ts
export * from './follow/FollowUserUseCase';
export * from './follow/UnfollowUserUseCase';
```

- [ ] **Step 9: Typecheck**

Run: `pnpm typecheck`
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add app/packages/application/src/follow/FollowUserUseCase.ts \
        app/packages/application/src/follow/UnfollowUserUseCase.ts \
        app/packages/application/src/follow/__tests__/FollowUserUseCase.test.ts \
        app/packages/application/src/follow/__tests__/UnfollowUserUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): FollowUserUseCase + UnfollowUserUseCase (P1.1)

Mapped to SRS: FR-FOLLOW-001, FR-FOLLOW-002. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Follow request send + cancel use cases

**Files:**
- Create: `app/packages/application/src/follow/SendFollowRequestUseCase.ts`
- Create: `app/packages/application/src/follow/CancelFollowRequestUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/SendFollowRequestUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/CancelFollowRequestUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test for SendFollowRequestUseCase**

```ts
// app/packages/application/src/follow/__tests__/SendFollowRequestUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { SendFollowRequestUseCase } from '../SendFollowRequestUseCase';
import { FakeUserRepository } from './FakeUserRepository';
import { FollowError } from '../errors';

describe('SendFollowRequestUseCase', () => {
  it('creates a pending request', async () => {
    const repo = new FakeUserRepository();
    const uc = new SendFollowRequestUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastSendRequest).toEqual({ requesterId: 'u_a', targetId: 'u_b' });
    expect(out.request.status).toBe('pending');
  });

  it('rejects self-request', async () => {
    const repo = new FakeUserRepository();
    const uc = new SendFollowRequestUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });

  it('treats pending_request_exists as idempotent success', async () => {
    const repo = new FakeUserRepository();
    repo.sendRequestError = new FollowError('pending_request_exists', 'exists');
    const uc = new SendFollowRequestUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.request.status).toBe('pending');
  });

  it('propagates cooldown_active with cooldownUntil', async () => {
    const repo = new FakeUserRepository();
    repo.sendRequestError = new FollowError('cooldown_active', 'cooldown', {
      cooldownUntil: '2026-06-01T00:00:00Z',
    });
    const uc = new SendFollowRequestUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'cooldown_active', cooldownUntil: '2026-06-01T00:00:00Z' });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @kc/application test -- SendFollowRequestUseCase`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement SendFollowRequestUseCase**

```ts
// app/packages/application/src/follow/SendFollowRequestUseCase.ts
/** FR-FOLLOW-003 — send a follow request to a Private profile. */
import type { FollowRequest } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError, isFollowError } from './errors';

export interface SendFollowRequestInput {
  viewerId: string;
  targetUserId: string;
}

export interface SendFollowRequestOutput {
  request: FollowRequest;
}

export class SendFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: SendFollowRequestInput): Promise<SendFollowRequestOutput> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    try {
      const request = await this.users.sendFollowRequest(input.viewerId, input.targetUserId);
      return { request };
    } catch (err) {
      // FR-FOLLOW-003 AC1 — idempotent: a pending row already exists.
      if (isFollowError(err) && err.code === 'pending_request_exists') {
        return {
          request: {
            requesterId: input.viewerId,
            targetId: input.targetUserId,
            createdAt: new Date().toISOString(),
            status: 'pending',
            cooldownUntil: null,
          },
        };
      }
      throw err;
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @kc/application test -- SendFollowRequestUseCase`
Expected: PASS (4 tests).

- [ ] **Step 5: Write failing test for CancelFollowRequestUseCase**

```ts
// app/packages/application/src/follow/__tests__/CancelFollowRequestUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { CancelFollowRequestUseCase } from '../CancelFollowRequestUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('CancelFollowRequestUseCase', () => {
  it('forwards (requesterId, targetId) to repo', async () => {
    const repo = new FakeUserRepository();
    const uc = new CancelFollowRequestUseCase(repo);

    await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastCancelRequest).toEqual({ requesterId: 'u_a', targetId: 'u_b' });
  });

  it('rejects self-cancel defensively', async () => {
    const repo = new FakeUserRepository();
    const uc = new CancelFollowRequestUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
```

- [ ] **Step 6: Implement CancelFollowRequestUseCase**

```ts
// app/packages/application/src/follow/CancelFollowRequestUseCase.ts
/** FR-FOLLOW-004 — requester cancels their own pending request. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface CancelFollowRequestInput {
  viewerId: string;
  targetUserId: string;
}

export class CancelFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CancelFollowRequestInput): Promise<void> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.cancelFollowRequest(input.viewerId, input.targetUserId);
  }
}
```

- [ ] **Step 7: Run all tests**

Run: `pnpm --filter @kc/application test -- follow`
Expected: PASS (12 tests so far).

- [ ] **Step 8: Add exports**

Append to `app/packages/application/src/index.ts` under the follow block:

```ts
export * from './follow/SendFollowRequestUseCase';
export * from './follow/CancelFollowRequestUseCase';
```

- [ ] **Step 9: Typecheck + commit**

Run: `pnpm typecheck` (expect green).

```bash
git add app/packages/application/src/follow/SendFollowRequestUseCase.ts \
        app/packages/application/src/follow/CancelFollowRequestUseCase.ts \
        app/packages/application/src/follow/__tests__/SendFollowRequestUseCase.test.ts \
        app/packages/application/src/follow/__tests__/CancelFollowRequestUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): SendFollowRequest + CancelFollowRequest use cases (P1.1)

Mapped to SRS: FR-FOLLOW-003, FR-FOLLOW-004. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Accept + Reject + RemoveFollower use cases

**Files:**
- Create: `app/packages/application/src/follow/AcceptFollowRequestUseCase.ts`
- Create: `app/packages/application/src/follow/RejectFollowRequestUseCase.ts`
- Create: `app/packages/application/src/follow/RemoveFollowerUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/AcceptFollowRequestUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/RejectFollowRequestUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/RemoveFollowerUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing tests (all three)**

```ts
// app/packages/application/src/follow/__tests__/AcceptFollowRequestUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { AcceptFollowRequestUseCase } from '../AcceptFollowRequestUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('AcceptFollowRequestUseCase', () => {
  it('forwards (requesterId, targetId) to repo (target accepts)', async () => {
    const repo = new FakeUserRepository();
    const uc = new AcceptFollowRequestUseCase(repo);

    await uc.execute({ targetId: 'u_target', requesterId: 'u_requester' });

    expect(repo.lastAcceptRequest).toEqual({
      requesterId: 'u_requester',
      targetId: 'u_target',
    });
  });

  it('rejects when target === requester', async () => {
    const repo = new FakeUserRepository();
    const uc = new AcceptFollowRequestUseCase(repo);

    await expect(
      uc.execute({ targetId: 'u_a', requesterId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
```

```ts
// app/packages/application/src/follow/__tests__/RejectFollowRequestUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { RejectFollowRequestUseCase } from '../RejectFollowRequestUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('RejectFollowRequestUseCase', () => {
  it('forwards to repo (target rejects, no notification)', async () => {
    const repo = new FakeUserRepository();
    const uc = new RejectFollowRequestUseCase(repo);

    await uc.execute({ targetId: 'u_target', requesterId: 'u_requester' });

    expect(repo.lastRejectRequest).toEqual({
      requesterId: 'u_requester',
      targetId: 'u_target',
    });
  });

  it('rejects when target === requester', async () => {
    const repo = new FakeUserRepository();
    const uc = new RejectFollowRequestUseCase(repo);

    await expect(
      uc.execute({ targetId: 'u_a', requesterId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
```

```ts
// app/packages/application/src/follow/__tests__/RemoveFollowerUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { RemoveFollowerUseCase } from '../RemoveFollowerUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('RemoveFollowerUseCase', () => {
  it('hard-deletes the follow edge (followerId is the one being removed)', async () => {
    const repo = new FakeUserRepository();
    const uc = new RemoveFollowerUseCase(repo);

    await uc.execute({ ownerId: 'u_owner', followerId: 'u_follower' });

    // The edge has followerId=u_follower, followedId=u_owner — and the
    // unfollow call signature is (followerId, followedId). When OWNER removes
    // FOLLOWER, the use case must call unfollow(followerId, followedId=ownerId).
    expect(repo.lastUnfollow).toEqual({
      followerId: 'u_follower',
      followedId: 'u_owner',
    });
  });

  it('rejects when ownerId === followerId', async () => {
    const repo = new FakeUserRepository();
    const uc = new RemoveFollowerUseCase(repo);

    await expect(
      uc.execute({ ownerId: 'u_a', followerId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @kc/application test -- "AcceptFollowRequest|RejectFollowRequest|RemoveFollower"`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the three use cases**

```ts
// app/packages/application/src/follow/AcceptFollowRequestUseCase.ts
/** FR-FOLLOW-005 — target accepts a pending request. DB trigger creates the edge. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface AcceptFollowRequestInput {
  targetId: string;
  requesterId: string;
}

export class AcceptFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: AcceptFollowRequestInput): Promise<void> {
    if (input.targetId === input.requesterId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.acceptFollowRequest(input.requesterId, input.targetId);
  }
}
```

```ts
// app/packages/application/src/follow/RejectFollowRequestUseCase.ts
/** FR-FOLLOW-006 — target rejects silently; DB trigger sets a 14-day cooldown. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface RejectFollowRequestInput {
  targetId: string;
  requesterId: string;
}

export class RejectFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: RejectFollowRequestInput): Promise<void> {
    if (input.targetId === input.requesterId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.rejectFollowRequest(input.requesterId, input.targetId);
  }
}
```

```ts
// app/packages/application/src/follow/RemoveFollowerUseCase.ts
/** FR-FOLLOW-009 — owner removes a current follower. No notification (AC4). */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface RemoveFollowerInput {
  ownerId: string;
  followerId: string;
}

export class RemoveFollowerUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: RemoveFollowerInput): Promise<void> {
    if (input.ownerId === input.followerId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    // Edge orientation: followerId follows ownerId. Either party can DELETE
    // (RLS in 0003: `follow_edges_delete_participants`).
    await this.users.unfollow(input.followerId, input.ownerId);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @kc/application test -- follow`
Expected: PASS (18 tests so far).

- [ ] **Step 5: Add exports**

Append to `app/packages/application/src/index.ts`:

```ts
export * from './follow/AcceptFollowRequestUseCase';
export * from './follow/RejectFollowRequestUseCase';
export * from './follow/RemoveFollowerUseCase';
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm typecheck` (expect green).

```bash
git add app/packages/application/src/follow/AcceptFollowRequestUseCase.ts \
        app/packages/application/src/follow/RejectFollowRequestUseCase.ts \
        app/packages/application/src/follow/RemoveFollowerUseCase.ts \
        app/packages/application/src/follow/__tests__/AcceptFollowRequestUseCase.test.ts \
        app/packages/application/src/follow/__tests__/RejectFollowRequestUseCase.test.ts \
        app/packages/application/src/follow/__tests__/RemoveFollowerUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): Accept + Reject + RemoveFollower use cases (P1.1)

Mapped to SRS: FR-FOLLOW-005, FR-FOLLOW-006, FR-FOLLOW-009. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: List use cases (followers / following / pending)

**Files:**
- Create: `app/packages/application/src/follow/ListFollowersUseCase.ts`
- Create: `app/packages/application/src/follow/ListFollowingUseCase.ts`
- Create: `app/packages/application/src/follow/ListPendingFollowRequestsUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/ListFollowersUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/ListFollowingUseCase.test.ts`
- Create: `app/packages/application/src/follow/__tests__/ListPendingFollowRequestsUseCase.test.ts`
- Modify: `app/packages/application/src/ports/IUserRepository.ts` (add `getPendingFollowRequestsWithUsers`)
- Modify: `app/packages/application/src/follow/__tests__/FakeUserRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Extend port + fake**

Modify `app/packages/application/src/ports/IUserRepository.ts` — replace the existing `getPendingFollowRequests` line (around line 75) with two methods:

```ts
  getPendingFollowRequests(userId: string): Promise<FollowRequest[]>;
  /**
   * FR-FOLLOW-007 AC2 — pending requests joined with the requester's User row.
   * Used to render avatar+name+city without a second round-trip per row.
   */
  getPendingFollowRequestsWithUsers(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<import('../follow/types').PaginatedRequests>;
```

Modify `app/packages/application/src/follow/__tests__/FakeUserRepository.ts` — add the new method on the class (after the existing `getPendingFollowRequests`):

```ts
  pendingRequestsWithUsers: import('@kc/domain').FollowRequest extends never ? never : {
    requests: import('../types').FollowRequestWithUser[];
    nextCursor: string | null;
  } = { requests: [], nextCursor: null };

  async getPendingFollowRequestsWithUsers(
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    this.lastGetPendingRequests = { userId };
    return this.pendingRequestsWithUsers;
  }
```

Add `NOT_IMPL` stub in `SupabaseUserRepository.ts` (after the existing `getPendingFollowRequests` stub):

```ts
  async getPendingFollowRequestsWithUsers() {
    throw NOT_IMPL('getPendingFollowRequestsWithUsers', 'P1.1');
  }
```

(Mark with the same `Promise<never>` shape as siblings; types still satisfied.)

- [ ] **Step 2: Write failing tests**

```ts
// app/packages/application/src/follow/__tests__/ListFollowersUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { ListFollowersUseCase } from '../ListFollowersUseCase';
import { FakeUserRepository, makeUser } from './FakeUserRepository';

describe('ListFollowersUseCase', () => {
  it('forwards (userId, limit, cursor) and returns paginated users', async () => {
    const repo = new FakeUserRepository();
    repo.followers = [makeUser({ userId: 'u_1' }), makeUser({ userId: 'u_2' })];
    const uc = new ListFollowersUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });

    expect(repo.lastGetFollowers).toEqual({ userId: 'u_owner', limit: 50, cursor: undefined });
    expect(out.users).toHaveLength(2);
    expect(out.nextCursor).toBeNull();
  });

  it('returns nextCursor when limit equals page size', async () => {
    const repo = new FakeUserRepository();
    repo.followers = Array.from({ length: 50 }, (_, i) => makeUser({ userId: `u_${i}` }));
    const uc = new ListFollowersUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });
    expect(out.nextCursor).toBe('u_49');
  });

  it('clamps limit to a sensible max (100)', async () => {
    const repo = new FakeUserRepository();
    const uc = new ListFollowersUseCase(repo);

    await uc.execute({ userId: 'u_owner', limit: 9999 });
    expect(repo.lastGetFollowers?.limit).toBe(100);
  });
});
```

```ts
// app/packages/application/src/follow/__tests__/ListFollowingUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { ListFollowingUseCase } from '../ListFollowingUseCase';
import { FakeUserRepository, makeUser } from './FakeUserRepository';

describe('ListFollowingUseCase', () => {
  it('forwards and paginates', async () => {
    const repo = new FakeUserRepository();
    repo.following = [makeUser({ userId: 'u_x' })];
    const uc = new ListFollowingUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });
    expect(repo.lastGetFollowing).toEqual({ userId: 'u_owner', limit: 50, cursor: undefined });
    expect(out.users).toHaveLength(1);
  });
});
```

```ts
// app/packages/application/src/follow/__tests__/ListPendingFollowRequestsUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { ListPendingFollowRequestsUseCase } from '../ListPendingFollowRequestsUseCase';
import { FakeUserRepository, makeUser } from './FakeUserRepository';

describe('ListPendingFollowRequestsUseCase', () => {
  it('forwards (targetId, limit, cursor) and returns requests with requester users', async () => {
    const repo = new FakeUserRepository();
    repo.pendingRequestsWithUsers = {
      requests: [
        {
          request: {
            requesterId: 'u_r',
            targetId: 'u_target',
            createdAt: '2026-05-01T00:00:00Z',
            status: 'pending',
            cooldownUntil: null,
          },
          requester: makeUser({ userId: 'u_r' }),
        },
      ],
      nextCursor: null,
    };
    const uc = new ListPendingFollowRequestsUseCase(repo);

    const out = await uc.execute({ targetId: 'u_target', limit: 50 });
    expect(out.requests).toHaveLength(1);
    expect(out.requests[0].requester.userId).toBe('u_r');
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

Run: `pnpm --filter @kc/application test -- "ListFollowers|ListFollowing|ListPendingFollowRequests"`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement the three use cases**

```ts
// app/packages/application/src/follow/ListFollowersUseCase.ts
/** FR-PROFILE-009 / FR-PROFILE-010 — paginated followers list. */
import type { IUserRepository } from '../ports/IUserRepository';
import type { PaginatedUsers } from './types';

const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;

export interface ListFollowersInput {
  userId: string;
  limit?: number;
  cursor?: string;
}

export class ListFollowersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListFollowersInput): Promise<PaginatedUsers> {
    const limit = Math.min(Math.max(input.limit ?? PAGE_DEFAULT, 1), PAGE_MAX);
    const list = await this.users.getFollowers(input.userId, limit, input.cursor);
    const nextCursor = list.length === limit ? list[list.length - 1].userId : null;
    return { users: list, nextCursor };
  }
}
```

```ts
// app/packages/application/src/follow/ListFollowingUseCase.ts
/** FR-PROFILE-009 / FR-PROFILE-010 — paginated following list. */
import type { IUserRepository } from '../ports/IUserRepository';
import type { PaginatedUsers } from './types';

const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;

export interface ListFollowingInput {
  userId: string;
  limit?: number;
  cursor?: string;
}

export class ListFollowingUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListFollowingInput): Promise<PaginatedUsers> {
    const limit = Math.min(Math.max(input.limit ?? PAGE_DEFAULT, 1), PAGE_MAX);
    const list = await this.users.getFollowing(input.userId, limit, input.cursor);
    const nextCursor = list.length === limit ? list[list.length - 1].userId : null;
    return { users: list, nextCursor };
  }
}
```

```ts
// app/packages/application/src/follow/ListPendingFollowRequestsUseCase.ts
/** FR-FOLLOW-007 — pending follow-request inbox for Private profile owner. */
import type { IUserRepository } from '../ports/IUserRepository';
import type { PaginatedRequests } from './types';

const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;

export interface ListPendingFollowRequestsInput {
  targetId: string;
  limit?: number;
  cursor?: string;
}

export class ListPendingFollowRequestsUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListPendingFollowRequestsInput): Promise<PaginatedRequests> {
    const limit = Math.min(Math.max(input.limit ?? PAGE_DEFAULT, 1), PAGE_MAX);
    return this.users.getPendingFollowRequestsWithUsers(input.targetId, limit, input.cursor);
  }
}
```

- [ ] **Step 5: Run all follow tests**

Run: `pnpm --filter @kc/application test -- follow`
Expected: PASS (24 tests).

- [ ] **Step 6: Add exports**

Append to `app/packages/application/src/index.ts`:

```ts
export * from './follow/ListFollowersUseCase';
export * from './follow/ListFollowingUseCase';
export * from './follow/ListPendingFollowRequestsUseCase';
```

- [ ] **Step 7: Typecheck + commit**

Run: `pnpm typecheck` (expect green).

```bash
git add app/packages/application/src/follow/ListFollowersUseCase.ts \
        app/packages/application/src/follow/ListFollowingUseCase.ts \
        app/packages/application/src/follow/ListPendingFollowRequestsUseCase.ts \
        app/packages/application/src/follow/__tests__/ \
        app/packages/application/src/ports/IUserRepository.ts \
        app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): list use cases — followers, following, pending requests (P1.1)

Mapped to SRS: FR-FOLLOW-007, FR-PROFILE-009, FR-PROFILE-010. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: GetFollowStateUseCase

**Files:**
- Create: `app/packages/application/src/follow/GetFollowStateUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/GetFollowStateUseCase.test.ts`
- Modify: `app/packages/application/src/ports/IUserRepository.ts` (add `getFollowStateRaw`)
- Modify: `app/packages/application/src/follow/__tests__/FakeUserRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Add `getFollowStateRaw` to port + fake + repo stub**

Modify `app/packages/application/src/ports/IUserRepository.ts` — append to the Follows block:

```ts
  /**
   * FR-FOLLOW-011 — single round-trip probe. Returns the raw signals the
   * `GetFollowStateUseCase` needs to derive a `FollowState`. Avoids 4 separate
   * round-trips on every profile load.
   */
  getFollowStateRaw(viewerId: string, targetUserId: string): Promise<FollowStateRaw>;
```

And declare/import the type at the top of the file:

```ts
import type {
  User, AuthIdentity, FollowEdge, FollowRequest, Block, OnboardingState,
} from '@kc/domain';

/** Raw signals from DB used to derive FR-FOLLOW-011 state. */
export interface FollowStateRaw {
  /** target.privacy_mode + target.account_status. null if target not visible / does not exist. */
  target: { userId: string; privacyMode: 'Public' | 'Private'; accountStatus: 'active' | 'suspended' | 'deleted' } | null;
  /** Whether `viewer follows target`. */
  followingExists: boolean;
  /** Pending request from viewer to target. */
  pendingRequestExists: boolean;
  /** Active rejection cooldown from viewer to target (or null if expired/none). */
  cooldownUntil: string | null;
  /** Bilateral block check between viewer and target. */
  blocked: boolean;
}
```

Modify `FakeUserRepository.ts` — add stub at the bottom of the class:

```ts
  followStateRaw: import('../../ports/IUserRepository').FollowStateRaw = {
    target: null,
    followingExists: false,
    pendingRequestExists: false,
    cooldownUntil: null,
    blocked: false,
  };
  async getFollowStateRaw() {
    return this.followStateRaw;
  }
```

Modify `SupabaseUserRepository.ts` — add NOT_IMPL stub:

```ts
  async getFollowStateRaw() {
    throw NOT_IMPL('getFollowStateRaw', 'P1.1');
  }
```

- [ ] **Step 2: Write failing test**

```ts
// app/packages/application/src/follow/__tests__/GetFollowStateUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { GetFollowStateUseCase } from '../GetFollowStateUseCase';
import { FakeUserRepository } from './FakeUserRepository';

const baseRaw = {
  target: { userId: 'u_target', privacyMode: 'Public' as const, accountStatus: 'active' as const },
  followingExists: false,
  pendingRequestExists: false,
  cooldownUntil: null,
  blocked: false,
};

describe('GetFollowStateUseCase', () => {
  it('returns "self" when viewer === target', async () => {
    const repo = new FakeUserRepository();
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' });
    expect(out.state).toBe('self');
  });

  it('returns "blocked" when bilateral block exists', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, blocked: true };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('blocked');
  });

  it('returns "not_following_public" for a public target with no edge', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('not_following_public');
  });

  it('returns "following" when edge exists (regardless of privacy mode)', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, followingExists: true };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('following');
  });

  it('returns "not_following_private_no_request" for private target with no edge / pending / cooldown', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' },
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('not_following_private_no_request');
  });

  it('returns "request_pending" when a pending request exists', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' },
      pendingRequestExists: true,
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('request_pending');
  });

  it('returns "cooldown_after_reject" with cooldownUntil when active', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' },
      cooldownUntil: '2026-06-01T00:00:00Z',
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('cooldown_after_reject');
    expect(out.cooldownUntil).toBe('2026-06-01T00:00:00Z');
  });

  it('throws user_not_found when target is null', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, target: null };
    const uc = new GetFollowStateUseCase(repo);
    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });

  it('throws user_not_found when target is suspended', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, accountStatus: 'suspended' },
    };
    const uc = new GetFollowStateUseCase(repo);
    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

Run: `pnpm --filter @kc/application test -- GetFollowStateUseCase`
Expected: FAIL.

- [ ] **Step 4: Implement use case**

```ts
// app/packages/application/src/follow/GetFollowStateUseCase.ts
/** FR-FOLLOW-011 — derive the 5-state machine from raw DB signals. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';
import type { FollowStateInfo } from './types';

export interface GetFollowStateInput {
  viewerId: string;
  targetUserId: string;
}

export class GetFollowStateUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: GetFollowStateInput): Promise<FollowStateInfo> {
    if (input.viewerId === input.targetUserId) {
      return { state: 'self' };
    }
    const raw = await this.users.getFollowStateRaw(input.viewerId, input.targetUserId);

    // Block short-circuit beats every other branch.
    if (raw.blocked) return { state: 'blocked' };

    if (!raw.target || raw.target.accountStatus !== 'active') {
      throw new FollowError('user_not_found', 'user_not_found');
    }

    if (raw.followingExists) return { state: 'following' };

    if (raw.target.privacyMode === 'Public') {
      return { state: 'not_following_public' };
    }

    // Private from here on
    if (raw.pendingRequestExists) return { state: 'request_pending' };
    if (raw.cooldownUntil) {
      return { state: 'cooldown_after_reject', cooldownUntil: raw.cooldownUntil };
    }
    return { state: 'not_following_private_no_request' };
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @kc/application test -- follow`
Expected: PASS (33 tests so far).

- [ ] **Step 6: Add export + commit**

Append to `app/packages/application/src/index.ts`:

```ts
export * from './follow/GetFollowStateUseCase';
```

Run `pnpm typecheck` (expect green).

```bash
git add app/packages/application/src/follow/GetFollowStateUseCase.ts \
        app/packages/application/src/follow/__tests__/GetFollowStateUseCase.test.ts \
        app/packages/application/src/follow/__tests__/FakeUserRepository.ts \
        app/packages/application/src/ports/IUserRepository.ts \
        app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): GetFollowStateUseCase + FollowStateRaw port (P1.1)

Mapped to SRS: FR-FOLLOW-011. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: UpdatePrivacyModeUseCase

**Files:**
- Create: `app/packages/application/src/follow/UpdatePrivacyModeUseCase.ts`
- Create: `app/packages/application/src/follow/__tests__/UpdatePrivacyModeUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/packages/application/src/follow/__tests__/UpdatePrivacyModeUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { UpdatePrivacyModeUseCase } from '../UpdatePrivacyModeUseCase';
import { FakeUserRepository, makeUser } from './FakeUserRepository';

describe('UpdatePrivacyModeUseCase', () => {
  it('flips Public → Private and returns updated user', async () => {
    const repo = new FakeUserRepository();
    repo.user = makeUser({ privacyMode: 'Public' });
    repo.setPrivacyModeResult = makeUser({ privacyMode: 'Private', privacyChangedAt: '2026-05-10T00:00:00Z' });
    const uc = new UpdatePrivacyModeUseCase(repo);

    const out = await uc.execute({ userId: 'u_test', mode: 'Private' });

    expect(repo.lastSetPrivacyMode).toEqual({ userId: 'u_test', mode: 'Private' });
    expect(out.user.privacyMode).toBe('Private');
  });

  it('no-ops when mode === current', async () => {
    const repo = new FakeUserRepository();
    repo.user = makeUser({ privacyMode: 'Public' });
    const uc = new UpdatePrivacyModeUseCase(repo);

    const out = await uc.execute({ userId: 'u_test', mode: 'Public' });

    expect(repo.lastSetPrivacyMode).toBeNull();
    expect(out.user.privacyMode).toBe('Public');
  });

  it('throws user_not_found if user is missing', async () => {
    const repo = new FakeUserRepository();
    repo.user = null;
    const uc = new UpdatePrivacyModeUseCase(repo);

    await expect(
      uc.execute({ userId: 'u_test', mode: 'Private' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `pnpm --filter @kc/application test -- UpdatePrivacyModeUseCase`
Expected: FAIL.

- [ ] **Step 3: Implement use case**

```ts
// app/packages/application/src/follow/UpdatePrivacyModeUseCase.ts
/** FR-PROFILE-005 / FR-PROFILE-006 — toggle privacy mode. DB trigger handles
 *  side-effects (auto-approve pending requests on Private→Public). */
import type { PrivacyMode, User } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface UpdatePrivacyModeInput {
  userId: string;
  mode: PrivacyMode;
}

export interface UpdatePrivacyModeOutput {
  user: User;
}

export class UpdatePrivacyModeUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UpdatePrivacyModeInput): Promise<UpdatePrivacyModeOutput> {
    const current = await this.users.findById(input.userId);
    if (!current) throw new FollowError('user_not_found', 'user_not_found');
    if (current.privacyMode === input.mode) return { user: current };
    const updated = await this.users.setPrivacyMode(input.userId, input.mode);
    return { user: updated };
  }
}
```

- [ ] **Step 4: Run tests + add export + commit**

```bash
pnpm --filter @kc/application test -- follow
# Expect 36 tests passing
```

Append to `app/packages/application/src/index.ts`:

```ts
export * from './follow/UpdatePrivacyModeUseCase';
```

```bash
pnpm typecheck   # green

git add app/packages/application/src/follow/UpdatePrivacyModeUseCase.ts \
        app/packages/application/src/follow/__tests__/UpdatePrivacyModeUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "$(cat <<'EOF'
feat(follow): UpdatePrivacyModeUseCase (P1.1)

Mapped to SRS: FR-PROFILE-005, FR-PROFILE-006. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Infrastructure (Supabase adapters)

### Task 9: mapFollowError

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/follow/mapFollowError.ts`

- [ ] **Step 1: Implement the mapper**

```ts
// app/packages/infrastructure-supabase/src/users/follow/mapFollowError.ts
// Postgres error → typed FollowError mapping. See migration 0003 for the
// trigger-raised error names this maps from.

import { FollowError } from '@kc/application';

interface PgErrorShape {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
}

export function mapFollowError(err: unknown): Error {
  const pg = (err ?? {}) as PgErrorShape;
  const text = `${pg.message ?? ''} ${pg.details ?? ''}`;

  // self_follow_forbidden / self_follow_request_forbidden — RAISE check_violation
  if (text.includes('self_follow_forbidden') || text.includes('self_follow_request_forbidden')) {
    return new FollowError('self_follow', text, { cause: err });
  }
  // blocked_relationship — RAISE check_violation
  if (text.includes('blocked_relationship')) {
    return new FollowError('blocked_relationship', text, { cause: err });
  }
  // already_following — RAISE check_violation from follow_requests trigger
  if (text.includes('already_following')) {
    return new FollowError('already_following', text, { cause: err });
  }
  // follow_request_cooldown_active — RAISE check_violation; cooldown_until in detail
  if (text.includes('follow_request_cooldown_active')) {
    const m = text.match(/cooldown_until=([0-9TZ:.+-]+)/);
    return new FollowError('cooldown_active', text, {
      cause: err,
      cooldownUntil: m?.[1],
    });
  }
  // 23505 unique_violation on follow_requests_one_pending_per_pair_idx
  if (pg.code === '23505' && text.includes('follow_requests_one_pending_per_pair_idx')) {
    return new FollowError('pending_request_exists', text, { cause: err });
  }
  // PK conflict on follow_edges → already following
  if (pg.code === '23505' && text.includes('follow_edges_pkey')) {
    return new FollowError('already_following', text, { cause: err });
  }
  // 42501 RLS — surfaced as forbidden / blocked when invariants are intact
  if (pg.code === '42501') {
    return new FollowError('blocked_relationship', text, { cause: err });
  }
  return new FollowError('unknown', pg.message ?? 'unknown', { cause: err });
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/packages/infrastructure-supabase/src/users/follow/mapFollowError.ts
git commit -m "$(cat <<'EOF'
feat(follow-infra): mapFollowError adapter (P1.1)

Maps Postgres errors raised by triggers/RLS in migration 0003 to typed
FollowError codes. Self-follow / blocked / already-following / cooldown /
pending-exists are each mapped to their distinct code.

Mapped to SRS: FR-FOLLOW-001..006, 009. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Implement follow methods on SupabaseUserRepository (basic edges)

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/follow/followMethods.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`

- [ ] **Step 1: Implement followMethods.ts**

```ts
// app/packages/infrastructure-supabase/src/users/follow/followMethods.ts
// Concrete implementations of the IUserRepository follow-edge methods. Kept
// out of SupabaseUserRepository.ts to keep that file under the 200-LOC cap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowEdge, User } from '@kc/domain';
import { mapUserRow, type UserRow } from '../mapUserRow';
import { mapFollowError } from './mapFollowError';

export async function followEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<FollowEdge> {
  const { data, error } = await client
    .from('follow_edges')
    .insert({ follower_id: followerId, followed_id: followedId })
    .select('follower_id, followed_id, created_at')
    .single();
  if (error) throw mapFollowError(error);
  const row = data as { follower_id: string; followed_id: string; created_at: string };
  return {
    followerId: row.follower_id,
    followedId: row.followed_id,
    createdAt: row.created_at,
  };
}

export async function unfollowEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_edges')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId);
  if (error) throw mapFollowError(error);
}

export async function isFollowingEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('follow_edges')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();
  if (error) throw mapFollowError(error);
  return data !== null;
}

/**
 * Followers of `userId`. Cursor is the previous page's last user_id; the page
 * is sorted by created_at desc, but we use user_id for cursor stability — good
 * enough for a 50-row page in the MVP.
 */
export async function listFollowers(
  client: SupabaseClient,
  userId: string,
  limit: number,
  cursor?: string,
): Promise<User[]> {
  const q = client
    .from('follow_edges')
    .select('follower:follower_id(*)')
    .eq('followed_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) q.lt('follower_id', cursor);
  const { data, error } = await q;
  if (error) throw mapFollowError(error);
  return ((data ?? []) as unknown as { follower: UserRow | null }[])
    .map((r) => r.follower)
    .filter((u): u is UserRow => u !== null)
    .map(mapUserRow);
}

export async function listFollowing(
  client: SupabaseClient,
  userId: string,
  limit: number,
  cursor?: string,
): Promise<User[]> {
  const q = client
    .from('follow_edges')
    .select('followed:followed_id(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) q.lt('followed_id', cursor);
  const { data, error } = await q;
  if (error) throw mapFollowError(error);
  return ((data ?? []) as unknown as { followed: UserRow | null }[])
    .map((r) => r.followed)
    .filter((u): u is UserRow => u !== null)
    .map(mapUserRow);
}
```

- [ ] **Step 2: Wire into SupabaseUserRepository**

Modify `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`:

Replace the `async follow()` block with:

```ts
  async follow(followerId: string, followedId: string) {
    return followEdge(this.client, followerId, followedId);
  }
```

Replace `async unfollow(...)` body:

```ts
  async unfollow(followerId: string, followedId: string): Promise<void> {
    return unfollowEdge(this.client, followerId, followedId);
  }
```

Replace `async isFollowing(...)`:

```ts
  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    return isFollowingEdge(this.client, followerId, followedId);
  }
```

Replace `async getFollowers()`:

```ts
  async getFollowers(userId: string, limit: number, cursor?: string) {
    return listFollowers(this.client, userId, limit, cursor);
  }
```

Replace `async getFollowing()`:

```ts
  async getFollowing(userId: string, limit: number, cursor?: string) {
    return listFollowing(this.client, userId, limit, cursor);
  }
```

Add imports at the top:

```ts
import {
  followEdge,
  unfollowEdge,
  isFollowingEdge,
  listFollowers,
  listFollowing,
} from './follow/followMethods';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/follow/followMethods.ts \
        app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
git commit -m "$(cat <<'EOF'
feat(follow-infra): implement follow-edge methods (P1.1)

Replaces NOT_IMPL stubs in SupabaseUserRepository for follow / unfollow /
isFollowing / getFollowers / getFollowing. Logic extracted to
follow/followMethods.ts to keep SupabaseUserRepository.ts under the 200-LOC cap.

Mapped to SRS: FR-FOLLOW-001, FR-FOLLOW-002, FR-FOLLOW-009, FR-PROFILE-009, 010.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Implement follow-request methods + setPrivacyMode + getFollowStateRaw

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/follow/followRequestMethods.ts`
- Create: `app/packages/infrastructure-supabase/src/users/follow/getFollowState.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`

- [ ] **Step 1: Implement followRequestMethods.ts**

```ts
// app/packages/infrastructure-supabase/src/users/follow/followRequestMethods.ts
// Concrete implementations of the IUserRepository follow-request methods.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowRequest, FollowRequestStatus } from '@kc/domain';
import type { FollowRequestWithUser, PaginatedRequests } from '@kc/application';
import { mapUserRow, type UserRow } from '../mapUserRow';
import { mapFollowError } from './mapFollowError';

interface FollowRequestRow {
  requester_id: string;
  target_id: string;
  status: FollowRequestStatus;
  created_at: string;
  cooldown_until: string | null;
}

function rowToRequest(r: FollowRequestRow): FollowRequest {
  return {
    requesterId: r.requester_id,
    targetId: r.target_id,
    status: r.status,
    createdAt: r.created_at,
    cooldownUntil: r.cooldown_until,
  };
}

export async function sendRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<FollowRequest> {
  const { data, error } = await client
    .from('follow_requests')
    .insert({ requester_id: requesterId, target_id: targetId, status: 'pending' })
    .select('requester_id, target_id, status, created_at, cooldown_until')
    .single();
  if (error) throw mapFollowError(error);
  return rowToRequest(data as FollowRequestRow);
}

export async function cancelRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'cancelled' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function acceptRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  // Trigger creates the follow_edge atomically.
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function rejectRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  // Trigger stamps the 14-day cooldown.
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'rejected' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function listPendingRaw(
  client: SupabaseClient,
  targetId: string,
): Promise<FollowRequest[]> {
  const { data, error } = await client
    .from('follow_requests')
    .select('requester_id, target_id, status, created_at, cooldown_until')
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw mapFollowError(error);
  return ((data ?? []) as FollowRequestRow[]).map(rowToRequest);
}

export async function listPendingWithUsers(
  client: SupabaseClient,
  targetId: string,
  limit: number,
  cursor?: string,
): Promise<PaginatedRequests> {
  const q = client
    .from('follow_requests')
    .select(
      'requester_id, target_id, status, created_at, cooldown_until, requester:requester_id(*)',
    )
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) throw mapFollowError(error);

  const rows = (data ?? []) as unknown as (FollowRequestRow & { requester: UserRow | null })[];
  const requests: FollowRequestWithUser[] = rows
    .filter((r) => r.requester !== null)
    .map((r) => ({ request: rowToRequest(r), requester: mapUserRow(r.requester as UserRow) }));
  const nextCursor = requests.length === limit ? rows[rows.length - 1].created_at : null;
  return { requests, nextCursor };
}
```

- [ ] **Step 2: Implement getFollowState.ts**

```ts
// app/packages/infrastructure-supabase/src/users/follow/getFollowState.ts
// Single-round-trip probe for FR-FOLLOW-011 state derivation. Runs four
// targeted queries in parallel; each query reads at most a single row.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowStateRaw } from '@kc/application';

export async function fetchFollowStateRaw(
  client: SupabaseClient,
  viewerId: string,
  targetUserId: string,
): Promise<FollowStateRaw> {
  const [targetRes, edgeRes, pendingRes, cooldownRes, blockRes] = await Promise.all([
    client
      .from('users')
      .select('user_id, privacy_mode, account_status')
      .eq('user_id', targetUserId)
      .maybeSingle(),
    client
      .from('follow_edges')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('followed_id', targetUserId)
      .maybeSingle(),
    client
      .from('follow_requests')
      .select('requester_id')
      .eq('requester_id', viewerId)
      .eq('target_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    client
      .from('follow_requests')
      .select('cooldown_until')
      .eq('requester_id', viewerId)
      .eq('target_id', targetUserId)
      .eq('status', 'rejected')
      .gt('cooldown_until', new Date().toISOString())
      .order('cooldown_until', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // bilateral block — calls is_blocked() via RPC for correctness even when
    // RLS would hide an outgoing block from the viewer.
    client.rpc('is_blocked', { a: viewerId, b: targetUserId }),
  ]);

  return {
    target: targetRes.data
      ? {
          userId: (targetRes.data as { user_id: string }).user_id,
          privacyMode: (targetRes.data as { privacy_mode: 'Public' | 'Private' }).privacy_mode,
          accountStatus: (targetRes.data as { account_status: 'active' | 'suspended' | 'deleted' })
            .account_status,
        }
      : null,
    followingExists: edgeRes.data !== null,
    pendingRequestExists: pendingRes.data !== null,
    cooldownUntil: (cooldownRes.data as { cooldown_until: string | null } | null)?.cooldown_until ?? null,
    blocked: Boolean(blockRes.data),
  };
}
```

- [ ] **Step 3: Wire into SupabaseUserRepository**

Modify `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`:

Add to the imports at the top:

```ts
import {
  sendRequest, cancelRequest, acceptRequest, rejectRequest,
  listPendingRaw, listPendingWithUsers,
} from './follow/followRequestMethods';
import { fetchFollowStateRaw } from './follow/getFollowState';
```

Replace the request-related stubs:

```ts
  async sendFollowRequest(requesterId: string, targetId: string) {
    return sendRequest(this.client, requesterId, targetId);
  }
  async cancelFollowRequest(requesterId: string, targetId: string): Promise<void> {
    return cancelRequest(this.client, requesterId, targetId);
  }
  async acceptFollowRequest(requesterId: string, targetId: string): Promise<void> {
    return acceptRequest(this.client, requesterId, targetId);
  }
  async rejectFollowRequest(requesterId: string, targetId: string): Promise<void> {
    return rejectRequest(this.client, requesterId, targetId);
  }
  async getPendingFollowRequests(userId: string) {
    return listPendingRaw(this.client, userId);
  }
  async getPendingFollowRequestsWithUsers(userId: string, limit: number, cursor?: string) {
    return listPendingWithUsers(this.client, userId, limit, cursor);
  }
  async getFollowStateRaw(viewerId: string, targetUserId: string) {
    return fetchFollowStateRaw(this.client, viewerId, targetUserId);
  }
```

Replace the `setPrivacyMode` stub:

```ts
  async setPrivacyMode(userId: string, mode: import('@kc/domain').PrivacyMode): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .update({ privacy_mode: mode, privacy_changed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw new Error(`setPrivacyMode: ${error.message}`);
    return mapUserRow(data as unknown as UserRow);
  }
```

If the file is now over 200 lines (track the count), confirm by running `wc -l` — if so, leave a comment at the top noting the file is right at the cap and that any further additions trigger a method-block extraction.

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck   # green
wc -l app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts

git add app/packages/infrastructure-supabase/src/users/follow/ \
        app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
git commit -m "$(cat <<'EOF'
feat(follow-infra): follow-request + setPrivacyMode + getFollowStateRaw (P1.1)

Replaces remaining NOT_IMPL stubs. Follow-request methods delegate to triggers
in migration 0003 (auto-edge creation on accept, 14d cooldown on reject).
getFollowStateRaw runs five parallel single-row probes for fast UI state.

Mapped to SRS: FR-FOLLOW-003..006, 011, FR-PROFILE-005, 006. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: followComposition + container wiring

**Files:**
- Create: `app/apps/mobile/src/services/followComposition.ts`

- [ ] **Step 1: Mirror postsComposition pattern**

First, check the existing pattern:

Run: `cat app/apps/mobile/src/services/postsComposition.ts | head -40`
Expected: shows lazy-singleton pattern.

- [ ] **Step 2: Create followComposition.ts**

```ts
// app/apps/mobile/src/services/followComposition.ts
// Lazy-singleton wiring for follow use cases. Mirrors postsComposition.ts.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseUserRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  FollowUserUseCase,
  UnfollowUserUseCase,
  SendFollowRequestUseCase,
  CancelFollowRequestUseCase,
  AcceptFollowRequestUseCase,
  RejectFollowRequestUseCase,
  RemoveFollowerUseCase,
  ListFollowersUseCase,
  ListFollowingUseCase,
  ListPendingFollowRequestsUseCase,
  GetFollowStateUseCase,
  UpdatePrivacyModeUseCase,
} from '@kc/application';

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

let repo: SupabaseUserRepository | null = null;
function getRepo() {
  if (!repo) repo = new SupabaseUserRepository(getSupabaseClient({ storage: pickStorage() }));
  return repo;
}

export const getFollowUserUseCase = () => new FollowUserUseCase(getRepo());
export const getUnfollowUserUseCase = () => new UnfollowUserUseCase(getRepo());
export const getSendFollowRequestUseCase = () => new SendFollowRequestUseCase(getRepo());
export const getCancelFollowRequestUseCase = () => new CancelFollowRequestUseCase(getRepo());
export const getAcceptFollowRequestUseCase = () => new AcceptFollowRequestUseCase(getRepo());
export const getRejectFollowRequestUseCase = () => new RejectFollowRequestUseCase(getRepo());
export const getRemoveFollowerUseCase = () => new RemoveFollowerUseCase(getRepo());
export const getListFollowersUseCase = () => new ListFollowersUseCase(getRepo());
export const getListFollowingUseCase = () => new ListFollowingUseCase(getRepo());
export const getListPendingFollowRequestsUseCase = () => new ListPendingFollowRequestsUseCase(getRepo());
export const getGetFollowStateUseCase = () => new GetFollowStateUseCase(getRepo());
export const getUpdatePrivacyModeUseCase = () => new UpdatePrivacyModeUseCase(getRepo());
export const getFollowUserRepo = getRepo;
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/src/services/followComposition.ts
git commit -m "$(cat <<'EOF'
feat(follow): mobile composition layer for follow use cases (P1.1)

Mapped to SRS: FR-FOLLOW-001..009, 011; FR-PROFILE-005, 006. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C — Shared profile UI subcomponents

(Continued in Phase C section — see lower in this document.)

---

## Phase C — UI Subcomponents

### Task 13: ProfileHeader component

**Files:**
- Create: `app/apps/mobile/src/components/profile/ProfileHeader.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/apps/mobile/src/components/profile/ProfileHeader.tsx
// Shared profile header — avatar + display name + privacy lock + bio.
// Used by (tabs)/profile.tsx and user/[handle]/index.tsx.
// Mapped to: FR-PROFILE-001 AC1, FR-PROFILE-002 AC1, FR-PROFILE-011, 012.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../AvatarInitials';

export interface ProfileHeaderProps {
  displayName: string;
  handle?: string | null;          // optional @handle line under name
  avatarUrl: string | null;
  biography: string | null;
  privacyMode: 'Public' | 'Private';
  /** Owner sees a tappable lock that navigates to settings/privacy.
   *  Other users see a static lock. */
  onLockPress?: () => void;
  size?: number;
}

export function ProfileHeader({
  displayName, handle, avatarUrl, biography, privacyMode, onLockPress, size = 96,
}: ProfileHeaderProps) {
  const showLock = privacyMode === 'Private';
  return (
    <View style={styles.wrap}>
      <AvatarInitials name={displayName} avatarUrl={avatarUrl} size={size} />
      <View style={styles.nameRow}>
        <Text style={styles.displayName}>{displayName}</Text>
        {showLock ? (
          <Ionicons
            name="lock-closed"
            size={18}
            color={colors.textSecondary}
            onPress={onLockPress}
            accessibilityLabel="פרופיל פרטי"
            style={styles.lock}
          />
        ) : null}
      </View>
      {handle ? <Text style={styles.handle}>@{handle}</Text> : null}
      {biography ? <Text style={styles.bio}>{biography}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  displayName: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  lock: { marginTop: 2 },
  handle: { ...typography.body, color: colors.textSecondary },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'center', paddingHorizontal: spacing.md },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/src/components/profile/ProfileHeader.tsx
git commit -m "$(cat <<'EOF'
feat(ui): ProfileHeader shared subcomponent (P1.1)

Mapped to SRS: FR-PROFILE-001 AC1, FR-PROFILE-002 AC1, FR-PROFILE-011, 012.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: ProfileStatsRow component

**Files:**
- Create: `app/apps/mobile/src/components/profile/ProfileStatsRow.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/apps/mobile/src/components/profile/ProfileStatsRow.tsx
// Three counters: followers / following / posts. Tappable when not locked.
// Mapped to: FR-PROFILE-001 AC2, FR-PROFILE-002 AC3, FR-PROFILE-013.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@kc/ui';

export interface ProfileStatsRowProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  /** When false, counters are not tappable (private profile, viewer not approved). */
  enabled: boolean;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export function ProfileStatsRow({
  followersCount, followingCount, postsCount, enabled,
  onPressFollowers, onPressFollowing,
}: ProfileStatsRowProps) {
  return (
    <View style={styles.row}>
      <Stat
        count={followersCount}
        label="עוקבים"
        onPress={enabled ? onPressFollowers : undefined}
      />
      <View style={styles.divider} />
      <Stat
        count={followingCount}
        label="נעקבים"
        onPress={enabled ? onPressFollowing : undefined}
      />
      <View style={styles.divider} />
      <Stat count={postsCount} label="פוסטים" />
    </View>
  );
}

function Stat({
  count, label, onPress,
}: { count: number; label: string; onPress?: () => void }) {
  const inner = (
    <View style={styles.stat}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} style={styles.statTouch}>{inner}</TouchableOpacity>
  ) : inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statTouch: { flex: 1 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  count: { ...typography.h2, color: colors.textPrimary },
  label: { ...typography.caption, color: colors.textSecondary },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/src/components/profile/ProfileStatsRow.tsx
git commit -m "$(cat <<'EOF'
feat(ui): ProfileStatsRow shared subcomponent (P1.1)

Mapped to SRS: FR-PROFILE-001 AC2, FR-PROFILE-002 AC3, FR-PROFILE-013.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: ProfileTabs + ProfilePostsGrid + LockedPanel

**Files:**
- Create: `app/apps/mobile/src/components/profile/ProfileTabs.tsx`
- Create: `app/apps/mobile/src/components/profile/ProfilePostsGrid.tsx`
- Create: `app/apps/mobile/src/components/profile/LockedPanel.tsx`

- [ ] **Step 1: ProfileTabs**

```tsx
// app/apps/mobile/src/components/profile/ProfileTabs.tsx
// Open / closed tabs row. Used by both profile screens.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@kc/ui';

export type ProfileTab = 'open' | 'closed';

export function ProfileTabs({
  active, onChange,
}: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <View style={styles.row}>
      <Tab label="פוסטים פתוחים" active={active === 'open'} onPress={() => onChange('open')} />
      <Tab label="פוסטים סגורים" active={active === 'closed'} onPress={() => onChange('closed')} />
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  text: { ...typography.button, color: colors.textSecondary },
  textActive: { color: colors.primary },
});
```

- [ ] **Step 2: ProfilePostsGrid**

```tsx
// app/apps/mobile/src/components/profile/ProfilePostsGrid.tsx
// Posts grid + loader + empty state. Used by both profile screens.
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@kc/ui';
import type { Post } from '@kc/domain';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type EmptyVariant = 'self_open' | 'self_closed' | 'other_open' | 'other_closed';

export interface ProfilePostsGridProps {
  posts: Post[];
  isLoading: boolean;
  empty: EmptyVariant;
}

const EMPTY_COPY: Record<EmptyVariant, { title: string; subtitle: string; icon: 'mail-open-outline' | 'archive-outline' }> = {
  self_open: { title: 'אין פוסטים פתוחים', subtitle: 'פרסם את הפוסט הראשון שלך!', icon: 'mail-open-outline' },
  self_closed: { title: 'אין פוסטים סגורים עדיין', subtitle: 'פוסטים שסגרת כ-נמסר יופיעו כאן.', icon: 'archive-outline' },
  other_open: { title: 'אין פוסטים פתוחים', subtitle: 'משתמש זה עוד לא פרסם פוסטים.', icon: 'mail-open-outline' },
  other_closed: { title: 'אין פוסטים סגורים', subtitle: 'משתמש זה עוד לא סיים מסירה.', icon: 'archive-outline' },
};

export function ProfilePostsGrid({ posts, isLoading, empty }: ProfilePostsGridProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (posts.length === 0) {
    const e = EMPTY_COPY[empty];
    return <EmptyState icon={e.icon} title={e.title} subtitle={e.subtitle} />;
  }
  return (
    <View style={styles.grid}>
      {posts.map((p) => <PostCardProfile key={p.postId} post={p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.xs },
});
```

- [ ] **Step 3: LockedPanel**

```tsx
// app/apps/mobile/src/components/profile/LockedPanel.tsx
// Empty state shown to a non-follower viewing a Private profile (FR-PROFILE-003).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';

export interface LockedPanelProps {
  /** When provided, shown below the title. */
  hint?: string;
}

export function LockedPanel({ hint }: LockedPanelProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed" size={36} color={colors.textSecondary} />
      <Text style={styles.title}>פרופיל פרטי</Text>
      <Text style={styles.body}>
        שלח בקשה לעקוב כדי לראות פוסטים, עוקבים ונעקבים.
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: spacing.base, padding: spacing.lg, backgroundColor: colors.surface,
    borderRadius: radius.lg, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/src/components/profile/ProfileTabs.tsx \
        app/apps/mobile/src/components/profile/ProfilePostsGrid.tsx \
        app/apps/mobile/src/components/profile/LockedPanel.tsx
git commit -m "$(cat <<'EOF'
feat(ui): ProfileTabs + ProfilePostsGrid + LockedPanel (P1.1)

Mapped to SRS: FR-PROFILE-001 AC4, FR-PROFILE-003 AC2, FR-PROFILE-013.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: FollowButton component

**Files:**
- Create: `app/apps/mobile/src/components/profile/FollowButton.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/apps/mobile/src/components/profile/FollowButton.tsx
// Five-state follow button per FR-FOLLOW-011. Hidden in self/blocked states —
// caller must check that itself; this component renders nothing for those.

import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { FollowState } from '@kc/application';

export interface FollowButtonProps {
  state: FollowState;
  cooldownUntil?: string;
  /** Called only on enabled states. The caller decides which use case to invoke. */
  onPress: () => void;
  /** When true, briefly shows a spinner-like disabled state. */
  busy?: boolean;
}

export function FollowButton({ state, cooldownUntil, onPress, busy }: FollowButtonProps) {
  if (state === 'self' || state === 'blocked') return null;

  const cfg = config(state, cooldownUntil);
  const disabled = busy || cfg.disabled;

  return (
    <TouchableOpacity
      style={[styles.btn, cfg.style, disabled && styles.btnDisabled]}
      disabled={disabled}
      onPress={() => {
        if (cfg.confirm) {
          Alert.alert(cfg.confirm.title, cfg.confirm.body, [
            { text: 'ביטול', style: 'cancel' },
            { text: cfg.confirm.cta, style: cfg.confirm.destructive ? 'destructive' : 'default', onPress },
          ]);
        } else {
          onPress();
        }
      }}
    >
      <Text style={[styles.text, cfg.textStyle]}>{cfg.label}</Text>
      {cfg.subtitle ? <Text style={styles.subtitle}>{cfg.subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

interface ButtonCfg {
  label: string;
  style?: object;
  textStyle?: object;
  disabled?: boolean;
  subtitle?: string;
  confirm?: { title: string; body: string; cta: string; destructive?: boolean };
}

function config(state: FollowState, cooldownUntil?: string): ButtonCfg {
  switch (state) {
    case 'not_following_public':
      return { label: '+ עקוב' };
    case 'following':
      return {
        label: 'עוקב ✓',
        style: styles.btnSecondary,
        textStyle: styles.textSecondary,
        confirm: { title: 'להפסיק לעקוב?', body: '', cta: 'הפסק לעקוב', destructive: true },
      };
    case 'not_following_private_no_request':
      return { label: '+ שלח בקשה' };
    case 'request_pending':
      return {
        label: 'בקשה נשלחה ⏳',
        style: styles.btnSecondary,
        textStyle: styles.textSecondary,
        confirm: { title: 'לבטל את בקשת המעקב?', body: 'תוכלי לשלוח בקשה חדשה בכל עת.', cta: 'בטל בקשה' },
      };
    case 'cooldown_after_reject': {
      const days = cooldownUntil ? Math.max(0, Math.ceil(
        (new Date(cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )) : 0;
      return {
        label: '+ שלח בקשה',
        disabled: true,
        subtitle: `ניתן לשלוח שוב בעוד ${days} ימים`,
      };
    }
    /* istanbul ignore next */
    default: return { label: '' };
  }
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, alignItems: 'center', alignSelf: 'stretch',
  },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnDisabled: { opacity: 0.5 },
  text: { ...typography.button, color: colors.textInverse, fontWeight: '700' as const },
  textSecondary: { color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/src/components/profile/FollowButton.tsx
git commit -m "$(cat <<'EOF'
feat(ui): FollowButton with 5-state machine (P1.1)

Mapped to SRS: FR-FOLLOW-011. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Profile Screens

### Task 17: Refactor (tabs)/profile.tsx to use shared subcomponents

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Rewrite the screen**

Replace the entire body of `app/apps/mobile/app/(tabs)/profile.tsx` (preserving existing imports for `useAuthStore`, `getMyPostsUseCase`, `getPostRepo`, `getUserRepo`, `useRouter`, `useQuery`, etc.) with the new structure that uses the shared subcomponents. Open the existing file, read it, and apply this replacement that keeps all existing data-fetching logic but routes rendering through the new components.

Concrete edit (read the file first to get exact line numbers; replace `<View style={styles.profileCard}>...</View>` block plus the tabs + grid blocks with):

```tsx
        <View style={styles.profileCard}>
          <ProfileHeader
            displayName={displayName}
            avatarUrl={avatarUrl}
            biography={biography}
            privacyMode={user?.privacyMode ?? 'Public'}
            onLockPress={() => router.push('/settings/privacy')}
            size={72}
          />

          <ProfileStatsRow
            followersCount={user?.followersCount ?? 0}
            followingCount={user?.followingCount ?? 0}
            postsCount={openCountQuery.data ?? 0}
            enabled
            onPressFollowers={() => router.push({
              pathname: '/user/[handle]/followers',
              params: { handle: user?.shareHandle ?? '' },
            })}
            onPressFollowing={() => router.push({
              pathname: '/user/[handle]/following',
              params: { handle: user?.shareHandle ?? '' },
            })}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editBtnText}>ערוך פרופיל</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ProfileTabs active={activeTab} onChange={setActiveTab} />

        <ProfilePostsGrid
          posts={myPostsQuery.data?.posts ?? []}
          isLoading={myPostsQuery.isLoading}
          empty={activeTab === 'open' ? 'self_open' : 'self_closed'}
        />
```

Add imports:

```tsx
import { ProfileHeader } from '../../src/components/profile/ProfileHeader';
import { ProfileStatsRow } from '../../src/components/profile/ProfileStatsRow';
import { ProfileTabs } from '../../src/components/profile/ProfileTabs';
import { ProfilePostsGrid } from '../../src/components/profile/ProfilePostsGrid';
```

Remove now-unused styles: `profileHeader`, `profileInfo`, `displayName`, `email`, `biography`, `statsRow`, `statDivider`, `tabs`, `tab`, `tabActive`, `tabText`, `tabTextActive`, `loadingWrap`, `grid`. Keep `container`, `sectionHeader`, `topBarTitle`, `profileCard`, `actionRow`, `editBtn`, `editBtnText`, `shareBtn`. Remove the inline `StatItem` component and its `statStyles`. Remove the `resolveDisplayName` helper if no longer referenced.

After the edit the file should be ~120 LOC.

- [ ] **Step 2: Verify visual parity manually**

Run: `pnpm --filter @kc/mobile web` (or `pnpm ios` / `pnpm android`).
Open My Profile. Confirm visual is unchanged from the screenshot baseline (header, three counters, tabs, posts grid).

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck   # green
pnpm lint:arch || true   # confirm 200-LOC cap respected

git add app/apps/mobile/app/(tabs)/profile.tsx
git commit -m "$(cat <<'EOF'
refactor(profile): My Profile uses shared profile/* subcomponents (P1.1)

No visual change. Routes follower/following counters to /user/[handle]/[list]
in preparation for the rebuilt other-user profile.

Mapped to SRS: FR-PROFILE-001. Refactor logged: Yes (extract subcomponents).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Build user/[handle]/_layout.tsx + index.tsx (other-user profile)

**Files:**
- Delete: `app/apps/mobile/app/user/[handle].tsx`
- Create: `app/apps/mobile/app/user/[handle]/_layout.tsx`
- Create: `app/apps/mobile/app/user/[handle]/index.tsx`

- [ ] **Step 1: Move + delete**

```bash
mkdir -p app/apps/mobile/app/user/[handle]
git rm app/apps/mobile/app/user/[handle].tsx
```

- [ ] **Step 2: Create `_layout.tsx`**

```tsx
// app/apps/mobile/app/user/[handle]/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function UserHandleLayout() {
  return <Stack screenOptions={{ headerShown: true }} />;
}
```

- [ ] **Step 3: Create the rebuilt `index.tsx`**

```tsx
// app/apps/mobile/app/user/[handle]/index.tsx
// Other-user profile — three modes (Public / Private-approved / Private-not-approved).
// Mapped to SRS: FR-PROFILE-002, 003, 004; FR-FOLLOW-001..006, 011, 012.

import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { isFollowError } from '@kc/application';
import { ProfileHeader } from '../../../src/components/profile/ProfileHeader';
import { ProfileStatsRow } from '../../../src/components/profile/ProfileStatsRow';
import { ProfileTabs, type ProfileTab } from '../../../src/components/profile/ProfileTabs';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { LockedPanel } from '../../../src/components/profile/LockedPanel';
import { FollowButton } from '../../../src/components/profile/FollowButton';
import { useAuthStore } from '../../../src/store/authStore';
import { container } from '../../../src/lib/container';
import { getUserRepo } from '../../../src/services/userComposition';
import { getPostRepo, getMyPostsUseCase } from '../../../src/services/postsComposition';
import {
  getFollowUserUseCase, getUnfollowUserUseCase,
  getSendFollowRequestUseCase, getCancelFollowRequestUseCase,
  getGetFollowStateUseCase,
} from '../../../src/services/followComposition';

export default function OtherProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('open');

  // 1) Fetch the target user
  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const u = userQuery.data ?? null;

  // 2) Fetch follow state
  const stateQuery = useQuery({
    queryKey: ['follow-state', me, u?.userId],
    queryFn: () => getGetFollowStateUseCase().execute({ viewerId: me!, targetUserId: u!.userId }),
    enabled: Boolean(me && u?.userId),
  });
  const followInfo = stateQuery.data;

  // 3) Counters: postsCount comes from Post repo (public-visible count for non-self viewer)
  const postsCountQuery = useQuery({
    queryKey: ['profile-other-post-count', u?.userId],
    queryFn: () => getPostRepo().countOpenByUser(u!.userId),
    enabled: Boolean(u?.userId),
  });

  // 4) Posts list — only when allowed (Public OR following accepted)
  const allowed = followInfo?.state === 'following' || u?.privacyMode === 'Public';
  const postsQuery = useQuery({
    queryKey: ['profile-other-posts', u?.userId, activeTab],
    queryFn: () => getMyPostsUseCase().execute({
      userId: u!.userId,
      status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
      limit: 30,
    }),
    enabled: Boolean(allowed && u?.userId),
  });

  if (!handle || userQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!u) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'פרופיל' }} />
        <View style={styles.notFound}><Text style={styles.notFoundText}>משתמש לא נמצא</Text></View>
      </SafeAreaView>
    );
  }

  const isMe = me === u.userId;
  const handleAction = async (action: 'follow' | 'unfollow' | 'send' | 'cancel') => {
    if (!me) return;
    try {
      if (action === 'follow') await getFollowUserUseCase().execute({ viewerId: me, targetUserId: u.userId });
      if (action === 'unfollow') await getUnfollowUserUseCase().execute({ viewerId: me, targetUserId: u.userId });
      if (action === 'send') await getSendFollowRequestUseCase().execute({ viewerId: me, targetUserId: u.userId });
      if (action === 'cancel') await getCancelFollowRequestUseCase().execute({ viewerId: me, targetUserId: u.userId });
      qc.invalidateQueries({ queryKey: ['follow-state', me, u.userId] });
      qc.invalidateQueries({ queryKey: ['profile-other', handle] });
    } catch (err) {
      if (isFollowError(err) && err.code === 'cooldown_active') {
        Alert.alert('לא ניתן לשלוח כרגע', 'נסה שוב כשהקירור יסתיים.');
      } else {
        Alert.alert('שגיאה', 'הפעולה נכשלה. נסו שוב.');
      }
    }
  };

  const onFollowPress = () => {
    const s = followInfo?.state;
    if (s === 'not_following_public') return handleAction('follow');
    if (s === 'following') return handleAction('unfollow');
    if (s === 'not_following_private_no_request') return handleAction('send');
    if (s === 'request_pending') return handleAction('cancel');
  };

  const startChat = async () => {
    if (!me) return;
    const chat = await container.openOrCreateChat.execute({ viewerId: me, otherUserId: u.userId });
    router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
  };

  const block = async () => {
    if (!me) return;
    Alert.alert('חסום משתמש?', `${u.displayName} לא יוכל לראות את הפרופיל שלך או לשלוח לך הודעות.`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'חסום', style: 'destructive',
        onPress: async () => {
          try {
            await container.blockUser.execute({ blockerId: me, blockedId: u.userId });
            router.back();
          } catch { Alert.alert('שגיאה'); }
        },
      },
    ]);
  };

  const showLocked = u.privacyMode === 'Private' && followInfo?.state !== 'following' && !isMe;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: u.displayName }} />
      <ScrollView>
        <View style={styles.card}>
          <ProfileHeader
            displayName={u.displayName}
            handle={u.shareHandle}
            avatarUrl={u.avatarUrl}
            biography={u.biography}
            privacyMode={u.privacyMode}
          />

          <ProfileStatsRow
            followersCount={u.followersCount}
            followingCount={u.followingCount}
            postsCount={postsCountQuery.data ?? 0}
            enabled={!showLocked}
            onPressFollowers={() => router.push({ pathname: '/user/[handle]/followers', params: { handle } })}
            onPressFollowing={() => router.push({ pathname: '/user/[handle]/following', params: { handle } })}
          />

          {!isMe ? (
            <View style={styles.actionRow}>
              {followInfo ? (
                <View style={styles.btnFlex}>
                  <FollowButton
                    state={followInfo.state}
                    cooldownUntil={followInfo.cooldownUntil}
                    onPress={onFollowPress}
                  />
                </View>
              ) : null}
              <TouchableOpacity style={styles.msgBtn} onPress={startChat}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                <Text style={styles.msgBtnText}>שלח הודעה</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={block}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {showLocked ? (
          <LockedPanel />
        ) : (
          <>
            <ProfileTabs active={activeTab} onChange={setActiveTab} />
            <ProfilePostsGrid
              posts={postsQuery.data?.posts ?? []}
              isLoading={postsQuery.isLoading}
              empty={activeTab === 'open' ? 'other_open' : 'other_closed'}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { padding: spacing.xl, alignItems: 'center' },
  notFoundText: { ...typography.h3, color: colors.textPrimary },
  card: {
    margin: spacing.base, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.base, ...shadow.card, gap: spacing.base,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  btnFlex: { flex: 1 },
  msgBtn: {
    height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: spacing.xs,
  },
  msgBtnText: { ...typography.button, color: colors.textPrimary },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
});
```

- [ ] **Step 4: Verify navigation works**

Run dev server, tap a user from chat header / post detail.
Expected: opens new profile screen, shows posts (or locked panel if private + not follower).

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck   # green
wc -l app/apps/mobile/app/user/[handle]/index.tsx   # should be ≤180

git add app/apps/mobile/app/user/[handle]/_layout.tsx \
        app/apps/mobile/app/user/[handle]/index.tsx \
        app/apps/mobile/app/user/[handle].tsx
git commit -m "$(cat <<'EOF'
feat(profile): rebuild other-user profile screen (P1.1)

Replaces the placeholder /user/[handle].tsx with a full FR-PROFILE-002/003/004
implementation: header + counters + tabs + posts grid + follow button +
message + block menu. Three modes via FollowState: Public, Private-approved
(full view), Private-not-approved (locked panel). Closes TD-40 partial; closes
TD-14 (counters now read from User).

Mapped to SRS: FR-PROFILE-002..004, 010, 013; FR-FOLLOW-001..006, 011, 012.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Followers list screen

**Files:**
- Create: `app/apps/mobile/app/user/[handle]/followers.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/apps/mobile/app/user/[handle]/followers.tsx
// Followers list — accessible when target is Public, or self, or Private-approved follower.
// FR-PROFILE-009 / FR-PROFILE-010. Each row carries dynamic Follow + ⋮ "Remove follower" if self.

import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { User } from '@kc/domain';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { LockedPanel } from '../../../src/components/profile/LockedPanel';
import { useAuthStore } from '../../../src/store/authStore';
import { getUserRepo } from '../../../src/services/userComposition';
import {
  getListFollowersUseCase,
  getRemoveFollowerUseCase,
  getGetFollowStateUseCase,
} from '../../../src/services/followComposition';

export default function FollowersListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const owner = userQuery.data;
  const isMe = me === owner?.userId;

  const stateQuery = useQuery({
    queryKey: ['follow-state', me, owner?.userId],
    queryFn: () => getGetFollowStateUseCase().execute({ viewerId: me!, targetUserId: owner!.userId }),
    enabled: Boolean(me && owner?.userId && !isMe),
  });
  const allowed = isMe || owner?.privacyMode === 'Public' || stateQuery.data?.state === 'following';

  const followersQuery = useQuery({
    queryKey: ['followers', owner?.userId],
    queryFn: () => getListFollowersUseCase().execute({ userId: owner!.userId, limit: 50 }),
    enabled: Boolean(allowed && owner?.userId),
  });

  if (!owner) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }
  if (!allowed) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'עוקבים' }} />
        <LockedPanel />
      </SafeAreaView>
    );
  }

  const filtered = (followersQuery.data?.users ?? []).filter((u) =>
    !search || u.displayName.toLowerCase().startsWith(search.toLowerCase()),
  );

  const onRemove = (follower: User) => {
    if (!me || !isMe) return;
    Alert.alert(
      'להסיר עוקב?',
      `${follower.displayName} לא יראה יותר פוסטים שיועדו לעוקבים בלבד, ולא יקבל על כך הודעה. אם הפרופיל שלך פתוח הם יוכלו לעקוב מחדש מיד; אם הוא פרטי — יצטרכו לשלוח בקשה.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסר',
          style: 'destructive',
          onPress: async () => {
            await getRemoveFollowerUseCase().execute({ ownerId: me, followerId: follower.userId });
            qc.invalidateQueries({ queryKey: ['followers', me] });
            qc.invalidateQueries({ queryKey: ['user-profile', me] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'עוקבים' }} />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי שם"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {followersQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>אין תוצאות</Text>
      ) : (
        filtered.map((u) => (
          <TouchableOpacity
            key={u.userId}
            style={styles.row}
            onPress={() => router.push({ pathname: '/user/[handle]', params: { handle: u.shareHandle } })}
          >
            <AvatarInitials name={u.displayName} avatarUrl={u.avatarUrl} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{u.displayName}</Text>
              <Text style={styles.city}>{u.cityName}</Text>
            </View>
            {isMe ? (
              <TouchableOpacity onPress={() => onRemove(u)} style={styles.menuBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        ))
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, margin: spacing.base, padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  menuBtn: { padding: spacing.xs },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/app/user/[handle]/followers.tsx
git commit -m "$(cat <<'EOF'
feat(profile): followers list screen with remove-follower for self (P1.1)

Mapped to SRS: FR-PROFILE-009, 010; FR-FOLLOW-009. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 20: Following list screen

**Files:**
- Create: `app/apps/mobile/app/user/[handle]/following.tsx`

- [ ] **Step 1: Implement**

Mirror the followers screen structure — same layout, but:
- Title: `"נעקבים"`
- Use `getListFollowingUseCase`
- Query key `['following', owner?.userId]`
- No `⋮` menu / `onRemove` (FR-FOLLOW-009 is followers-only).

```tsx
// app/apps/mobile/app/user/[handle]/following.tsx
// Following list — same access rules as followers (FR-PROFILE-010).

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { LockedPanel } from '../../../src/components/profile/LockedPanel';
import { useAuthStore } from '../../../src/store/authStore';
import { getUserRepo } from '../../../src/services/userComposition';
import {
  getListFollowingUseCase,
  getGetFollowStateUseCase,
} from '../../../src/services/followComposition';

export default function FollowingListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const [search, setSearch] = React.useState('');

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const owner = userQuery.data;
  const isMe = me === owner?.userId;

  const stateQuery = useQuery({
    queryKey: ['follow-state', me, owner?.userId],
    queryFn: () => getGetFollowStateUseCase().execute({ viewerId: me!, targetUserId: owner!.userId }),
    enabled: Boolean(me && owner?.userId && !isMe),
  });
  const allowed = isMe || owner?.privacyMode === 'Public' || stateQuery.data?.state === 'following';

  const followingQuery = useQuery({
    queryKey: ['following', owner?.userId],
    queryFn: () => getListFollowingUseCase().execute({ userId: owner!.userId, limit: 50 }),
    enabled: Boolean(allowed && owner?.userId),
  });

  if (!owner) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }
  if (!allowed) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'נעקבים' }} />
        <LockedPanel />
      </SafeAreaView>
    );
  }

  const filtered = (followingQuery.data?.users ?? []).filter((u) =>
    !search || u.displayName.toLowerCase().startsWith(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'נעקבים' }} />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי שם"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {followingQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>אין תוצאות</Text>
      ) : (
        filtered.map((u) => (
          <TouchableOpacity
            key={u.userId}
            style={styles.row}
            onPress={() => router.push({ pathname: '/user/[handle]', params: { handle: u.shareHandle } })}
          >
            <AvatarInitials name={u.displayName} avatarUrl={u.avatarUrl} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{u.displayName}</Text>
              <Text style={styles.city}>{u.cityName}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, margin: spacing.base, padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/app/user/[handle]/following.tsx
git commit -m "$(cat <<'EOF'
feat(profile): following list screen (P1.1)

Mapped to SRS: FR-PROFILE-009, 010. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E — Settings screens

### Task 21: Settings root + privacy screen

**Files:**
- Create: `app/apps/mobile/app/settings/index.tsx`
- Create: `app/apps/mobile/app/settings/privacy.tsx`

- [ ] **Step 1: Settings root (minimal)**

```tsx
// app/apps/mobile/app/settings/index.tsx
// Settings landing — minimal in P1.1. Full FR-SETTINGS-* lands in P2.1.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.body}>
        <Text style={styles.title}>הגדרות</Text>
        <Row icon="lock-closed-outline" label="פרטיות" onPress={() => router.push('/settings/privacy')} />
        <Row icon="warning-outline" label="דיווח על תקלה" onPress={() => router.push('/settings/report-issue')} />
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress }: { icon: 'lock-closed-outline' | 'warning-outline'; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  rowLabel: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
```

- [ ] **Step 2: Privacy screen**

```tsx
// app/apps/mobile/app/settings/privacy.tsx
// FR-PROFILE-005 / FR-PROFILE-006: Public ↔ Private toggle + follow-requests entry.

import React from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { useAuthStore } from '../../src/store/authStore';
import { getUserRepo } from '../../src/services/userComposition';
import {
  getUpdatePrivacyModeUseCase,
  getListPendingFollowRequestsUseCase,
} from '../../src/services/followComposition';

export default function PrivacyScreen() {
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user-profile', me],
    queryFn: () => getUserRepo().findById(me!),
    enabled: Boolean(me),
  });
  const user = userQuery.data;
  const isPrivate = user?.privacyMode === 'Private';

  const pendingQuery = useQuery({
    queryKey: ['pending-requests-count', me],
    queryFn: () => getListPendingFollowRequestsUseCase().execute({ targetId: me!, limit: 50 }),
    enabled: Boolean(me && isPrivate),
  });
  const pendingCount = pendingQuery.data?.requests.length ?? 0;

  const onToggle = (next: boolean) => {
    if (!me || !user) return;
    const goingPrivate = next === true;
    const title = goingPrivate ? 'להפוך את הפרופיל לפרטי?' : 'להפוך את הפרופיל לציבורי?';
    const body = goingPrivate
      ? 'בקשות עקיבה חדשות ידרשו אישור. עוקבים קיימים יישארו (אפשר להסיר אותם ידנית). פוסטים פתוחים יישארו פתוחים. תוכלי לפרסם פוסטים חדשים לעוקבים בלבד.'
      : 'כל הבקשות הממתינות יאושרו אוטומטית. פוסטים שפורסמו לעוקבים בלבד יישארו גלויים לכל עוקב חדש מעכשיו.';
    Alert.alert(title, body, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: goingPrivate ? 'הפוך לפרטי' : 'הפוך לציבורי',
        onPress: async () => {
          try {
            await getUpdatePrivacyModeUseCase().execute({
              userId: me,
              mode: goingPrivate ? 'Private' : 'Public',
            });
            qc.invalidateQueries({ queryKey: ['user-profile', me] });
            qc.invalidateQueries({ queryKey: ['pending-requests-count', me] });
          } catch {
            Alert.alert('שגיאה', 'ניסיון לעדכן את מצב הפרטיות נכשל. נסו שוב.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'פרטיות' }} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>פרופיל פרטי</Text>
            <Text style={styles.hint}>רק עוקבים מאושרים יראו את הפוסטים והעוקבים שלך.</Text>
          </View>
          <Switch value={isPrivate ?? false} onValueChange={onToggle} disabled={!user} />
        </View>

        {isPrivate ? (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/settings/follow-requests')}
          >
            <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.label, { flex: 1 }]}>בקשות עוקבים{pendingCount > 0 ? ` (${pendingCount})` : ''}</Text>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, gap: spacing.sm },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/app/settings/index.tsx app/apps/mobile/app/settings/privacy.tsx
git commit -m "$(cat <<'EOF'
feat(settings): privacy toggle + minimal settings root (P1.1)

Mapped to SRS: FR-PROFILE-005, FR-PROFILE-006, FR-FOLLOW-007 AC5.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: Follow-requests inbox screen

**Files:**
- Create: `app/apps/mobile/app/settings/follow-requests.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/apps/mobile/app/settings/follow-requests.tsx
// FR-FOLLOW-007: pending follow-request inbox. Reachable only when Private.

import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { FollowRequestWithUser } from '@kc/application';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { useAuthStore } from '../../src/store/authStore';
import { getUserRepo } from '../../src/services/userComposition';
import {
  getListPendingFollowRequestsUseCase,
  getAcceptFollowRequestUseCase,
  getRejectFollowRequestUseCase,
} from '../../src/services/followComposition';

export default function FollowRequestsScreen() {
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user-profile', me],
    queryFn: () => getUserRepo().findById(me!),
    enabled: Boolean(me),
  });
  const isPrivate = userQuery.data?.privacyMode === 'Private';

  const requestsQuery = useQuery({
    queryKey: ['pending-requests', me],
    queryFn: () => getListPendingFollowRequestsUseCase().execute({ targetId: me!, limit: 50 }),
    enabled: Boolean(me && isPrivate),
  });

  // FR-FOLLOW-007 AC4 — auto-dismiss when toggling to Public.
  React.useEffect(() => {
    if (userQuery.data && !isPrivate) router.back();
  }, [isPrivate, userQuery.data, router]);

  const onResolve = async (req: FollowRequestWithUser, action: 'accept' | 'reject') => {
    if (!me) return;
    try {
      if (action === 'accept') {
        await getAcceptFollowRequestUseCase().execute({
          targetId: me, requesterId: req.requester.userId,
        });
      } else {
        await getRejectFollowRequestUseCase().execute({
          targetId: me, requesterId: req.requester.userId,
        });
      }
      qc.invalidateQueries({ queryKey: ['pending-requests', me] });
      qc.invalidateQueries({ queryKey: ['pending-requests-count', me] });
      qc.invalidateQueries({ queryKey: ['user-profile', me] });
    } catch {
      Alert.alert('שגיאה', 'הפעולה נכשלה. נסו שוב.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'בקשות עוקבים' }} />
      {requestsQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (requestsQuery.data?.requests.length ?? 0) === 0 ? (
        <Text style={styles.empty}>אין בקשות ממתינות.{'\n'}בקשות חדשות יופיעו כאן.</Text>
      ) : (
        <View style={styles.list}>
          {requestsQuery.data!.requests.map((r) => (
            <View key={r.requester.userId} style={styles.row}>
              <TouchableOpacity
                style={styles.who}
                onPress={() => router.push({
                  pathname: '/user/[handle]',
                  params: { handle: r.requester.shareHandle },
                })}
              >
                <AvatarInitials name={r.requester.displayName} avatarUrl={r.requester.avatarUrl} size={44} />
                <View style={styles.text}>
                  <Text style={styles.name}>{r.requester.displayName}</Text>
                  <Text style={styles.city}>{r.requester.cityName}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btnApprove} onPress={() => onResolve(r, 'accept')}>
                  <Text style={styles.btnApproveText}>אשר</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => onResolve(r, 'reject')}>
                  <Text style={styles.btnRejectText}>דחה</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base, gap: spacing.sm },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  who: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flex: 1 },
  text: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.xs },
  btnApprove: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  btnApproveText: { ...typography.button, color: colors.textInverse, fontWeight: '700' as const },
  btnReject: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
  },
  btnRejectText: { ...typography.button, color: colors.textPrimary },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck   # green

git add app/apps/mobile/app/settings/follow-requests.tsx
git commit -m "$(cat <<'EOF'
feat(settings): pending follow-requests inbox (P1.1)

Mapped to SRS: FR-FOLLOW-005, FR-FOLLOW-006, FR-FOLLOW-007. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F — Documentation

### Task 23: Update SRS

**Files:**
- Modify: `docs/SSOT/SRS/02_functional_requirements/02_profile_and_privacy.md`
- Modify: `docs/SSOT/SRS/appendices/C_decisions_log.md`

- [ ] **Step 1: Update FR-PROFILE-002 AC2**

In `02_profile_and_privacy.md`, replace:

```markdown
- AC2. The "Closed Posts" tab is **never** shown for other users (privacy decision, PRD §3.2.2).
```

With:

```markdown
- AC2. The "Closed Posts" tab **is** shown for other users when the profile is `Public` (or `Private` and the viewer is an approved follower). Recipient identity ("נמסר ל-X") is included per the same rules as on My Profile (`FR-PROFILE-001`). Posts at `Only-me` visibility remain non-visible to non-owners. (Reverses earlier privacy decision; see EXEC-7 in the decision log.)
```

- [ ] **Step 2: Update FR-PROFILE-004 AC4**

Replace:

```markdown
- AC4. The "Closed Posts" tab is still hidden (privacy decision applies regardless of follow state).
```

With:

```markdown
- AC4. The "Closed Posts" tab is included; behaves as in `FR-PROFILE-002` AC2.
```

- [ ] **Step 3: Add EXEC-7 to decision log**

In `docs/SSOT/SRS/appendices/C_decisions_log.md`, append a new row to the EXEC table (or create the row in the right section per existing format):

```markdown
| EXEC-7 | פוסטים סגורים מוצגים בפרופיל של יוזר אחר (ציבורי או פרטי-עוקב-מאושר), כולל זהות המקבל. החלטה זו מהפכת את ההחלטה הקודמת ב-PRD §3.2.2; המודל הסוציאלי הוא "ראה איזה תרומות עזרת ולמי". פוסטים `Only-me` ממשיכים להיות מוסתרים. | P1.1 brainstorming | 2026-05-10 |
```

(Use the exact column ordering of the existing table — open the file first to confirm.)

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/SRS/02_functional_requirements/02_profile_and_privacy.md \
        docs/SSOT/SRS/appendices/C_decisions_log.md
git commit -m "$(cat <<'EOF'
docs(srs): closed-posts visible on other-user profile + EXEC-7 (P1.1)

FR-PROFILE-002 AC2 + FR-PROFILE-004 AC4 reverse the prior privacy carveout that
hid closed posts from other users. The new model treats closed posts as a
signal of community contribution and includes recipient identity per the same
visibility rules as My Profile.

Mapped to SRS: FR-PROFILE-002, FR-PROFILE-004. Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 24: Update PROJECT_STATUS + TECH_DEBT + HISTORY

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/HISTORY.md`

- [ ] **Step 1: PROJECT_STATUS — move P1.1 to Done; bump completion %**

In `docs/SSOT/PROJECT_STATUS.md`:

In the §2 priority table row for P1.1, replace `⏳ Planned` with `🟢 Done (2026-05-10)` and add a Notes summary referencing branch + the bundled FR-PROFILE-005/006.

Update §1 snapshot:
- "Last Updated" → today, with a one-line summary referencing the merged work.
- "MVP completion (rough)" → bump from ~50% to ~57%.
- "Features 🟢 done" → 9 (was 8).
- "What is in flight" / "What is fake / stubbed" → remove the "Other-user profile" line; add nothing.

Add to §3 Sprint Board:
> Most recently shipped: **P1.1** (following + other-user profile — FR-FOLLOW-001..009, 011, 012; FR-PROFILE-002..006, 009, 010, 013 — 2026-05-10).

Append to §4 Decisions table:

```markdown
| EXEC-7 | פוסטים סגורים מוצגים בפרופיל של יוזר אחר (ציבורי או פרטי-עוקב-מאושר), כולל זהות המקבל. מהפכת את החלטת PRD §3.2.2. | P1.1 | 2026-05-10 |
```

- [ ] **Step 2: TECH_DEBT — close TD-14 + TD-40 partial; open TD-124**

In `docs/SSOT/TECH_DEBT.md`:

- Locate TD-14 ("other-user counters render 0") — move to Resolved with note `Closed 2026-05-10 (P1.1).`
- Locate TD-40 ("user/[handle] placeholder") — move to Resolved with note `Closed 2026-05-10 (P1.1) — full profile screen rebuilt.`
- Add new active TD-124:

```markdown
**TD-124** — Push notifications for follow events.
P1.5 wiring needs to emit:
- `follow_started` (FR-FOLLOW-001 AC3) — instant follow on Public profile.
- `follow_request_received` (FR-FOLLOW-003 AC2 + FR-FOLLOW-007) — quick-actions Approve/Reject.
- `follow_approved` (FR-FOLLOW-005 AC3) — for the original requester.

DB events already fire via triggers; only push delivery is missing. Estimated as a sub-feature of P1.5.
```

- [ ] **Step 3: HISTORY — append on top**

In `docs/SSOT/HISTORY.md`, prepend a new entry:

```markdown
## 2026-05-10 — P1.1 Following + Other-User Profile

**SRS:** FR-FOLLOW-001..009, 011, 012; FR-PROFILE-002..006, 009, 010, 013.
**Branch / PR:** `claude/loving-varahamihira-01cd6d` → main (squash).
**Tests:** 109 → 145 vitest passing (+36 follow tests).
**TD deltas:** Closed TD-14, TD-40 (partial). Opened TD-124.
**Open gaps:** Push notifications for follow events deferred to P1.5 (TD-124).

Highlights:
- 12 new follow use cases under `packages/application/src/follow/`.
- `SupabaseUserRepository` follow methods moved from `NOT_IMPL` to real impls.
- Six shared profile/* subcomponents; My Profile refactored without visual change.
- `/user/[handle]` rebuilt as a full profile (3 modes: Public / Private-approved / Private-not-approved).
- Followers + Following list screens; Settings → Privacy + follow-requests inbox.
- Closed-posts visible on other-user profile (EXEC-7 reverses prior PRD carveout).
```

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/TECH_DEBT.md docs/SSOT/HISTORY.md
git commit -m "$(cat <<'EOF'
docs(status): P1.1 shipped — following + other-user profile

- PROJECT_STATUS: P1.1 → Done; completion ~57%; EXEC-7 in decisions table.
- TECH_DEBT: closed TD-14, TD-40 partial; opened TD-124 (push notif deferred).
- HISTORY: new top-of-log entry.

Mapped to SRS: FR-FOLLOW-001..009, 011, 012; FR-PROFILE-002..006, 009, 010, 013.
Refactor logged: No.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 25: Manual verification + lane-flip

**Files:** none (verification only)

- [ ] **Step 1: Run the test suite**

```bash
pnpm typecheck
pnpm --filter @kc/application test
pnpm lint:arch
```

Expected: all green; 145 vitest passing; LOC cap respected.

- [ ] **Step 2: Manual mobile verification (web preview)**

Run: `pnpm --filter @kc/mobile web`. Open the app at the LAN URL (see memory `dev_preview_url`). Sign in with the super-admin test account (memory `super_admin_test_account`).

Walk these flows:
1. **Public follow:** From feed → tap a post owner → other-user profile loads → "+ עקוב" → counter +1 on both sides → "עוקב ✓" → unfollow modal → counter -1.
2. **Counters tap:** On the new profile, tap "עוקבים" → list opens → tap row → that user's profile loads.
3. **Privacy toggle:** Settings → פרטיות → toggle on → modal → confirmed → 🔒 appears next to my name on My Profile.
4. **Follow request flow (Private):** Sign in as a second user, send request to the now-Private super-admin → "בקשה נשלחה ⏳". Switch back to super-admin → Settings → "בקשות עוקבים (1)" → אשר. Second user reload → "עוקב ✓".
5. **Reject + cooldown:** Repeat with דחה. Second user → button disabled with subtitle "ניתן לשלוח שוב בעוד 14 ימים".
6. **Locked panel:** Sign in as third (non-following) user → super-admin profile → only header + counters (not tappable) + LockedPanel.
7. **Closed-posts on other user:** Owner posts a Give post, marks delivered → second user views owner's profile → טאב "פוסטים סגורים" → post visible with recipient label.
8. **Block → button hides:** Owner blocks second user → second user reload → follow button hidden (Send Message + ⋮ remain by design until P1.4 polishes).

For each flow, capture a screenshot. If anything diverges from spec, file a follow-up TD or fix.

- [ ] **Step 3: Push branch + open draft PR**

```bash
git push -u origin claude/loving-varahamihira-01cd6d

gh pr create \
  --title "feat(P1.1): following + other-user profile (FR-FOLLOW-001..009, 011, 012; FR-PROFILE-002..006, 009, 010)" \
  --body "$(cat <<'EOF'
## Summary

- 12 new follow use cases (`packages/application/src/follow/`) with vitest coverage.
- `SupabaseUserRepository` follow + setPrivacyMode + getFollowStateRaw moved from NOT_IMPL to real implementations against migration 0003.
- Other-user profile rebuilt as full FR-PROFILE-002/003/004 — three modes (Public / Private-approved / Private-not-approved).
- Followers + Following list screens; Settings → Privacy + follow-requests inbox.
- Closed posts now visible on other-user profile (EXEC-7 reverses prior PRD carveout).
- Closed: TD-14, TD-40 partial. Opened: TD-124 (push notif deferred to P1.5).

Spec: `docs/superpowers/specs/2026-05-10-following-and-other-user-profile-design.md`
Plan: `docs/superpowers/plans/2026-05-10-following-and-other-user-profile-plan.md`

## Test plan

- [ ] `pnpm typecheck` green
- [ ] `pnpm --filter @kc/application test` — 145 passing
- [ ] `pnpm lint:arch` — LOC cap respected
- [ ] Manual mobile flows 1-8 from plan §25 pass
- [ ] Screenshots attached for each flow

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review (run after writing the plan, before handoff)

- ✅ **Spec coverage:** every Q1-Q6 decision in the spec maps to at least one task.
- ✅ **Placeholders:** none — every `<placeholder>` has been replaced.
- ✅ **Type consistency:** `FollowState`, `FollowStateRaw`, `FollowStateInfo`, `FollowError`, `FollowRequestWithUser`, `PaginatedUsers`, `PaginatedRequests`, `setPrivacyMode`, `getFollowStateRaw`, `getPendingFollowRequestsWithUsers` — all introduced before first use.
- ✅ **TDD:** Phase A use cases all follow Write test → Run fail → Implement → Run pass → Commit.
- ✅ **Frequent commits:** ~25 commits.
- ✅ **No skipped requirements:** FR-FOLLOW-007 AC4 (auto-dismiss inbox on toggle to Public) covered in Task 22 step 1.
