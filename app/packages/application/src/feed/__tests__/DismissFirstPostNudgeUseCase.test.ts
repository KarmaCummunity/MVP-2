import { describe, it, expect } from 'vitest';
import { DismissFirstPostNudgeUseCase } from '../DismissFirstPostNudgeUseCase';
import type { IUserRepository } from '../../ports/IUserRepository';

class CapturingUserRepo implements Partial<IUserRepository> {
  dismissFirstPostNudgeUserId: string | null = null;

  dismissFirstPostNudge = async (userId: string): Promise<void> => {
    this.dismissFirstPostNudgeUserId = userId;
  };
}

describe('DismissFirstPostNudgeUseCase', () => {
  it('persists dismissal through IUserRepository.dismissFirstPostNudge', async () => {
    const repo = new CapturingUserRepo();
    const uc = new DismissFirstPostNudgeUseCase(repo as unknown as IUserRepository);

    await uc.execute('u_abc');

    expect(repo.dismissFirstPostNudgeUserId).toBe('u_abc');
  });

  it('rejects an empty userId rather than writing to the wrong row', async () => {
    const repo = new CapturingUserRepo();
    const uc = new DismissFirstPostNudgeUseCase(repo as unknown as IUserRepository);

    await expect(uc.execute('')).rejects.toThrow(/userId is required/);
    expect(repo.dismissFirstPostNudgeUserId).toBeNull();
  });
});
