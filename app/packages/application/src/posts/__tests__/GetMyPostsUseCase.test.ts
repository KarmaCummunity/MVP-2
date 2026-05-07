import { describe, it, expect } from 'vitest';
import { GetMyPostsUseCase } from '../GetMyPostsUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('GetMyPostsUseCase', () => {
  it('forwards userId / status / limit / cursor', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 50, cursor: 'cur' });

    expect(repo.lastGetMyPostsArgs).toEqual({
      userId: 'u_1',
      status: ['open'],
      limit: 50,
      cursor: 'cur',
    });
  });

  it('clamps limit to [1, 100]; defaults to 20', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 0 });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(1);

    await uc.execute({ userId: 'u_1', status: ['open'], limit: 999 });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(100);

    await uc.execute({ userId: 'u_1', status: ['open'] });
    expect(repo.lastGetMyPostsArgs?.limit).toBe(20);
  });

  it('rejects empty status array (RLS would return [] anyway, but spell it out)', async () => {
    const repo = new FakePostRepository();
    const uc = new GetMyPostsUseCase(repo);
    await expect(uc.execute({ userId: 'u_1', status: [] })).rejects.toThrow(/status/);
  });
});
