import type { User, AuthIdentity, FollowEdge, FollowRequest, Block } from '@kc/domain';

// ── IUserRepository ───────────────────────────
// Port (interface) for user persistence.
// Implementations live in infrastructure-supabase.

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByHandle(handle: string): Promise<User | null>;
  create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  update(userId: string, patch: Partial<User>): Promise<User>;
  delete(userId: string): Promise<void>;

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
