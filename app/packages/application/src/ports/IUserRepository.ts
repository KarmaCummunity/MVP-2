import type { User, AuthIdentity, FollowEdge, FollowRequest, Block, OnboardingState } from '@kc/domain';

// ── IUserRepository ───────────────────────────
// Port (interface) for user persistence.
// Implementations live in infrastructure-supabase.

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByHandle(handle: string): Promise<User | null>;
  create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  update(userId: string, patch: Partial<User>): Promise<User>;
  delete(userId: string): Promise<void>;

  // ── Onboarding (P0.3) ─────────────────────────
  /** FR-AUTH-007 AC2: read state to decide where to land on cold-start. */
  getOnboardingState(userId: string): Promise<OnboardingState>;

  /** FR-AUTH-010: persist step-1 fields. `cityName` must mirror the matching `cities.name_he` row. */
  setBasicInfo(
    userId: string,
    params: { displayName: string; city: string; cityName: string },
  ): Promise<void>;

  /** FR-AUTH-010 AC3 / FR-AUTH-012 AC3: advance the onboarding state machine. */
  setOnboardingState(userId: string, state: OnboardingState): Promise<void>;

  /**
   * FR-AUTH-011 AC4 + AC5: persist the user's profile photo URL.
   * Pass `null` to clear an SSO-prefilled or previously-uploaded avatar (FR-PROFILE-007 also calls this).
   */
  setAvatar(userId: string, avatarUrl: string | null): Promise<void>;

  /**
   * FR-PROFILE-007 AC1: persist a user's biography. Pass `null` to clear it.
   * Caller is expected to enforce ≤ 200 chars + URL-filter validation upstream;
   * the DB still applies the length CHECK as defence in depth.
   */
  setBiography(userId: string, biography: string | null): Promise<void>;

  /**
   * FR-PROFILE-007: read the four editable fields for the Edit Profile form.
   * Avoids needing the full `findById` (which depends on follower / counter
   * mappings deferred to P2.4). Throws if the row is missing.
   */
  getEditableProfile(userId: string): Promise<{
    displayName: string;
    city: string;
    cityName: string;
    biography: string | null;
  }>;

  /** FR-CLOSURE-004 AC3 — flips users.closure_explainer_dismissed = true. Idempotent. */
  dismissClosureExplainer(userId: string): Promise<void>;

  /**
   * Lightweight user search by display name or share handle (case-insensitive
   * substring). Used by the closure flow's "pick from any user" mode (option 4)
   * when the recipient isn't in the owner's chat list. Excludes the caller
   * themselves and any users they have blocked.
   */
  searchUsers(query: string, opts: { excludeUserId: string; limit: number }): Promise<User[]>;

  // Follows
  follow(followerId: string, followedId: string): Promise<FollowEdge>;
  unfollow(followerId: string, followedId: string): Promise<void>;
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
  getFollowers(userId: string, limit: number, cursor?: string): Promise<User[]>;
  getFollowing(userId: string, limit: number, cursor?: string): Promise<User[]>;

  // Follow requests (private profiles)
  sendFollowRequest(requesterId: string, targetId: string): Promise<FollowRequest>;
  acceptFollowRequest(requesterId: string, targetId: string): Promise<void>;
  rejectFollowRequest(requesterId: string, targetId: string): Promise<void>;
  cancelFollowRequest(requesterId: string, targetId: string): Promise<void>;
  getPendingFollowRequests(userId: string): Promise<FollowRequest[]>;

  // Blocks
  block(blockerId: string, blockedId: string): Promise<Block>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<User[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  // Auth identities
  findByAuthIdentity(provider: string, subject: string): Promise<User | null>;
  createAuthIdentity(identity: Omit<AuthIdentity, 'createdAt'>): Promise<AuthIdentity>;
}
