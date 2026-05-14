import { describe, it, expect } from 'vitest';
import { RejectFollowRequestUseCase } from '../RejectFollowRequestUseCase';
import { FollowFakeUserRepository } from './followFakeUserRepository';

describe('RejectFollowRequestUseCase', () => {
  it('forwards to repo (target rejects, no notification)', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new RejectFollowRequestUseCase(repo);

    await uc.execute({ targetId: 'u_target', requesterId: 'u_requester' });

    expect(repo.lastRejectRequest).toEqual({
      requesterId: 'u_requester',
      targetId: 'u_target',
    });
  });

  it('rejects when target === requester', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new RejectFollowRequestUseCase(repo);

    await expect(
      uc.execute({ targetId: 'u_a', requesterId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
