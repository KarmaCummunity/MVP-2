import { describe, it, expect } from 'vitest';
import { RemoveFollowerUseCase } from '../RemoveFollowerUseCase';
import { FakeUserRepository } from './FakeUserRepository';

describe('RemoveFollowerUseCase', () => {
  it('hard-deletes the follow edge (followerId is the one being removed)', async () => {
    const repo = new FakeUserRepository();
    const uc = new RemoveFollowerUseCase(repo);

    await uc.execute({ ownerId: 'u_owner', followerId: 'u_follower' });

    // Edge orientation: followerId follows ownerId.
    // unfollow signature is (followerId, followedId) — when OWNER removes
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
