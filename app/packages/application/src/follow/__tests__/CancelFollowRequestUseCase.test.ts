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
