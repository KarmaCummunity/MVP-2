import { describe, it, expect } from 'vitest';
import { AdminRemovePostUseCase } from '../AdminRemovePostUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('AdminRemovePostUseCase', () => {
  it('forwards postId to repo.adminRemove', async () => {
    const repo = new FakePostRepository();
    const uc = new AdminRemovePostUseCase(repo);
    await uc.execute({ postId: 'p_42' });
    expect(repo.lastAdminRemovePostId).toBe('p_42');
  });

  it('propagates repo errors', async () => {
    const repo = new FakePostRepository();
    repo.adminRemoveError = new Error('forbidden');
    const uc = new AdminRemovePostUseCase(repo);
    await expect(uc.execute({ postId: 'p_42' })).rejects.toThrow('forbidden');
  });
});
