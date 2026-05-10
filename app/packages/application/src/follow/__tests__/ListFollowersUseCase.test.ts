import { describe, it, expect } from 'vitest';
import { ListFollowersUseCase } from '../ListFollowersUseCase';
import { FakeUserRepository, makeUser } from './FakeUserRepository';

describe('ListFollowersUseCase', () => {
  it('forwards (userId, limit, cursor) and returns paginated users', async () => {
    const repo = new FakeUserRepository();
    repo.followers = [makeUser({ userId: 'u_1' }), makeUser({ userId: 'u_2' })];
    const uc = new ListFollowersUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });

    expect(repo.lastGetFollowers).toEqual({ userId: 'u_owner', limit: 50, cursor: undefined });
    expect(out.users).toHaveLength(2);
    expect(out.nextCursor).toBeNull();
  });

  it('returns nextCursor when limit equals page size', async () => {
    const repo = new FakeUserRepository();
    repo.followers = Array.from({ length: 50 }, (_, i) => makeUser({ userId: `u_${i}` }));
    const uc = new ListFollowersUseCase(repo);

    const out = await uc.execute({ userId: 'u_owner', limit: 50 });
    expect(out.nextCursor).toBe('u_49');
  });

  it('clamps limit to a sensible max (100)', async () => {
    const repo = new FakeUserRepository();
    const uc = new ListFollowersUseCase(repo);

    await uc.execute({ userId: 'u_owner', limit: 9999 });
    expect(repo.lastGetFollowers?.limit).toBe(100);
  });
});
