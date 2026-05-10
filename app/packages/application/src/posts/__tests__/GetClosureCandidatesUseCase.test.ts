import { describe, it, expect } from 'vitest';
import { GetClosureCandidatesUseCase } from '../GetClosureCandidatesUseCase';
import { FakePostRepository, makeClosureCandidate } from './fakePostRepository';
import type { IUserRepository } from '../../ports/IUserRepository';
import type { User } from '@kc/domain';

class FakeUserRepoForBlocks {
  blockedUsers: User[] = [];
  async getBlockedUsers(): Promise<User[]> {
    return this.blockedUsers;
  }
}

const makeBlockedUser = (userId: string): User =>
  ({
    userId,
    handle: `h_${userId}`,
    displayName: 'blocked',
    biography: null,
    avatarUrl: null,
    city: 'tel-aviv',
    cityName: 'תל אביב',
    privacyMode: 'Public',
    onboardingState: 'completed',
    closureExplainerDismissed: false,
    firstPostNudgeDismissed: false,
    accountStatus: 'active',
    itemsGivenCount: 0,
    itemsReceivedCount: 0,
    followersCount: 0,
    followingCount: 0,
    activePostsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as User);

describe('GetClosureCandidatesUseCase', () => {
  it('returns all candidates when no one is blocked', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [
      makeClosureCandidate({ userId: 'u_a', fullName: 'דנה' }),
      makeClosureCandidate({ userId: 'u_b', fullName: 'יוסי' }),
    ];
    const userRepo = new FakeUserRepoForBlocks();
    const uc = new GetClosureCandidatesUseCase(postRepo, userRepo as unknown as IUserRepository);

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
    const userRepo = new FakeUserRepoForBlocks();
    userRepo.blockedUsers = [makeBlockedUser('u_b')];
    const uc = new GetClosureCandidatesUseCase(postRepo, userRepo as unknown as IUserRepository);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.userId).toBe('u_a');
  });

  it('returns empty when no chat partners exist', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [];
    const userRepo = new FakeUserRepoForBlocks();
    const uc = new GetClosureCandidatesUseCase(postRepo, userRepo as unknown as IUserRepository);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toEqual([]);
  });

  it('forwards postId to the repo', async () => {
    const postRepo = new FakePostRepository();
    const userRepo = new FakeUserRepoForBlocks();
    const uc = new GetClosureCandidatesUseCase(postRepo, userRepo as unknown as IUserRepository);

    await uc.execute({ postId: 'p_xyz', ownerId: 'u_owner' });

    expect(postRepo.lastGetClosureCandidatesPostId).toBe('p_xyz');
  });

  it('falls back to "no blocks" when the block repo throws (regression: closure flow getting stuck)', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [
      makeClosureCandidate({ userId: 'u_a' }),
      makeClosureCandidate({ userId: 'u_b' }),
    ];
    const userRepo = {
      // Simulates the original NOT_IMPL stub OR a transient RLS / network failure.
      getBlockedUsers: async () => {
        throw new Error('getBlockedUsers: not_implemented (P1.4)');
      },
    };
    const uc = new GetClosureCandidatesUseCase(postRepo, userRepo as unknown as IUserRepository);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.userId)).toEqual(['u_a', 'u_b']);
  });
});
