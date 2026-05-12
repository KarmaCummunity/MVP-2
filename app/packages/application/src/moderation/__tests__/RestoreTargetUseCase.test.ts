import { describe, it, expect } from 'vitest';
import { RestoreTargetUseCase } from '../RestoreTargetUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('RestoreTargetUseCase', () => {
  it('forwards targetType + targetId to repo.restoreTarget', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new RestoreTargetUseCase(repo);

    await uc.execute({ targetType: 'post', targetId: 'p_1' });

    expect(repo.restoreCalls).toEqual([{ targetType: 'post', targetId: 'p_1' }]);
  });

  it('propagates repo errors', async () => {
    const repo = new FakeModerationAdminRepository();
    repo.errorOnNext = new Error('invalid_restore_state');
    const uc = new RestoreTargetUseCase(repo);

    await expect(
      uc.execute({ targetType: 'user', targetId: 'u_1' }),
    ).rejects.toThrow('invalid_restore_state');
  });
});
