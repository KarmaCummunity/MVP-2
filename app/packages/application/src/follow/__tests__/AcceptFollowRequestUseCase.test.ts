import { describe, it, expect } from 'vitest';
import { AcceptFollowRequestUseCase } from '../AcceptFollowRequestUseCase';
import { FollowFakeUserRepository } from './followFakeUserRepository';

describe('AcceptFollowRequestUseCase', () => {
  it('forwards (requesterId, targetId) to repo (target accepts)', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new AcceptFollowRequestUseCase(repo);

    await uc.execute({ targetId: 'u_target', requesterId: 'u_requester' });

    expect(repo.lastAcceptRequest).toEqual({
      requesterId: 'u_requester',
      targetId: 'u_target',
    });
  });

  it('rejects when target === requester', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new AcceptFollowRequestUseCase(repo);

    await expect(
      uc.execute({ targetId: 'u_a', requesterId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
