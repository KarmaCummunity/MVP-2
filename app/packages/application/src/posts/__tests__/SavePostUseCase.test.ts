import { describe, it, expect } from 'vitest';
import { SavePostUseCase } from '../SavePostUseCase';
import { FakeSavedPostsRepository } from './fakeSavedPostsRepository';

describe('SavePostUseCase', () => {
  it('forwards postId to the repository', async () => {
    const repo = new FakeSavedPostsRepository();
    const uc = new SavePostUseCase(repo);
    await uc.execute('post_1');
    expect(repo.lastSavePostId).toBe('post_1');
  });

  it('rejects empty postId', async () => {
    const repo = new FakeSavedPostsRepository();
    const uc = new SavePostUseCase(repo);
    await expect(uc.execute('')).rejects.toThrow(/postId/);
  });
});
