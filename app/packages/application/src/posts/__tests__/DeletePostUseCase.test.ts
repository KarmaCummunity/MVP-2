import { describe, it, expect } from 'vitest';
import { DeletePostUseCase } from '../DeletePostUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('DeletePostUseCase', () => {
  it('forwards postId to repo.delete', async () => {
    const repo = new FakePostRepository();
    const uc = new DeletePostUseCase(repo);
    await uc.execute({ postId: 'p_1' });
    expect(repo.lastDeletePostId).toBe('p_1');
  });

  it('propagates repo errors', async () => {
    const repo = new FakePostRepository();
    repo.deleteError = new Error('rls_violation');
    const uc = new DeletePostUseCase(repo);
    await expect(uc.execute({ postId: 'p_1' })).rejects.toThrow('rls_violation');
  });
});
