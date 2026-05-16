import { describe, it, expect } from 'vitest';
import { ListFollowingUseCase } from '../ListFollowingUseCase';
import { FollowFakeUserRepository, makeUser } from './followFakeUserRepository';

describe('ListFollowingUseCase', () => {
  it('forwards and paginates', async () => {
    const repo = new FollowFakeUserRepository();
    repo.following = [makeUser({ userId: 'u_x' })];
    const uc = new ListFollowingUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });
    expect(repo.lastGetFollowing).toEqual({ userId: 'u_owner', limit: 50, cursor: undefined });
    expect(out.users).toHaveLength(1);
  });
});
