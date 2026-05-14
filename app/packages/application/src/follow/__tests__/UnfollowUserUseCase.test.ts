import { describe, it, expect } from 'vitest';
import { UnfollowUserUseCase } from '../UnfollowUserUseCase';
import { FollowFakeUserRepository } from './followFakeUserRepository';

describe('UnfollowUserUseCase', () => {
  it('forwards to repo and returns void', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new UnfollowUserUseCase(repo);

    await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastUnfollow).toEqual({ followerId: 'u_a', followedId: 'u_b' });
  });

  it('rejects self-unfollow defensively', async () => {
    const repo = new FollowFakeUserRepository();
    const uc = new UnfollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
  });
});
