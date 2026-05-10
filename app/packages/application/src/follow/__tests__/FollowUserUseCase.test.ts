import { describe, it, expect } from 'vitest';
import { FollowUserUseCase } from '../FollowUserUseCase';
import { FakeUserRepository } from './FakeUserRepository';
import { FollowError } from '../errors';

describe('FollowUserUseCase', () => {
  it('forwards (followerId, followedId) to the repo and returns the edge', async () => {
    const repo = new FakeUserRepository();
    const uc = new FollowUserUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });

    expect(repo.lastFollow).toEqual({ followerId: 'u_a', followedId: 'u_b' });
    expect(out.edge.followerId).toBe('u_a');
    expect(out.edge.followedId).toBe('u_b');
  });

  it('rejects self-follow before hitting the repo', async () => {
    const repo = new FakeUserRepository();
    const uc = new FollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' }),
    ).rejects.toMatchObject({ code: 'self_follow' });
    expect(repo.lastFollow).toBeNull();
  });

  it('treats already_following as success (idempotent)', async () => {
    const repo = new FakeUserRepository();
    repo.followError = new FollowError('already_following', 'already_following');
    const uc = new FollowUserUseCase(repo);

    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.edge.followerId).toBe('u_a');
  });

  it('propagates blocked_relationship', async () => {
    const repo = new FakeUserRepository();
    repo.followError = new FollowError('blocked_relationship', 'blocked_relationship');
    const uc = new FollowUserUseCase(repo);

    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'blocked_relationship' });
  });
});
