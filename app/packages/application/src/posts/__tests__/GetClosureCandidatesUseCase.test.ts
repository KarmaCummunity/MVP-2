import { describe, it, expect } from 'vitest';
import { GetClosureCandidatesUseCase } from '../GetClosureCandidatesUseCase';
import { FakePostRepository, makeClosureCandidate } from './fakePostRepository';

describe('GetClosureCandidatesUseCase', () => {
  it('returns the post repository candidates directly', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [
      makeClosureCandidate({ userId: 'u_a', fullName: 'דנה' }),
      makeClosureCandidate({ userId: 'u_b', fullName: 'יוסי' }),
    ];
    const uc = new GetClosureCandidatesUseCase(postRepo);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.userId)).toEqual(['u_a', 'u_b']);
  });

  it('returns empty when no chat partners exist', async () => {
    const postRepo = new FakePostRepository();
    postRepo.closureCandidatesResult = [];
    const uc = new GetClosureCandidatesUseCase(postRepo);

    const candidates = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(candidates).toEqual([]);
  });

  it('forwards postId to the repo', async () => {
    const postRepo = new FakePostRepository();
    const uc = new GetClosureCandidatesUseCase(postRepo);

    await uc.execute({ postId: 'p_xyz', ownerId: 'u_owner' });

    expect(postRepo.lastGetClosureCandidatesPostId).toBe('p_xyz');
  });
});
