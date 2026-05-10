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
    expect(out.requests[0]?.requester.userId).toBe('u_r');
  });
});
