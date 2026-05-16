import { describe, it, expect } from 'vitest';
import { ListSavedPostsUseCase } from '../ListSavedPostsUseCase';
import { FakeSavedPostsRepository } from './fakeSavedPostsRepository';

describe('ListSavedPostsUseCase', () => {
  it('forwards limit and cursor', async () => {
    const repo = new FakeSavedPostsRepository();
    const uc = new ListSavedPostsUseCase(repo);
    await uc.execute({ limit: 50, cursor: 'cur' });
    expect(repo.lastListSavedPostsArgs).toEqual({ limit: 50, cursor: 'cur' });
  });

  it('clamps limit to [1, 100]; defaults to 20', async () => {
    const repo = new FakeSavedPostsRepository();
    const uc = new ListSavedPostsUseCase(repo);

    await uc.execute({ limit: 0 });
    expect(repo.lastListSavedPostsArgs?.limit).toBe(1);

    await uc.execute({ limit: 999 });
    expect(repo.lastListSavedPostsArgs?.limit).toBe(100);

    await uc.execute({});
    expect(repo.lastListSavedPostsArgs?.limit).toBe(20);
  });

  it('returns nextCursor from the repo', async () => {
    const repo = new FakeSavedPostsRepository();
    repo.savedPostsNextCursor = 'next';
    const uc = new ListSavedPostsUseCase(repo);
    const out = await uc.execute({});
    expect(out.nextCursor).toBe('next');
  });
});
