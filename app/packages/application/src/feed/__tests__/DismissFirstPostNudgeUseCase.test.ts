import { describe, it, expect } from 'vitest';
import type { User } from '@kc/domain';
import { DismissFirstPostNudgeUseCase } from '../DismissFirstPostNudgeUseCase';
import type { IUserRepository } from '../../ports/IUserRepository';

class CapturingUserRepo implements Partial<IUserRepository> {
  lastUpdateArgs: { userId: string; patch: Partial<User> } | null = null;

  update = async (userId: string, patch: Partial<User>): Promise<User> => {
    this.lastUpdateArgs = { userId, patch };
    return makeUser({ userId, ...patch });
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    userId: 'u_1',
    authProvider: 'email',
    shareHandle: 'handle',
    displayName: 'Test',
    city: 'tel-aviv',
    cityName: 'תל אביב',
    biography: null,
    avatarUrl: null,
    privacyMode: 'Public',
    privacyChangedAt: null,
    accountStatus: 'active',
    onboardingState: 'completed',
    notificationPreferences: { critical: true, social: true },
    isSuperAdmin: false,
    closureExplainerDismissed: false,
    firstPostNudgeDismissed: false,
    itemsGivenCount: 0,
    itemsReceivedCount: 0,
    activePostsCountInternal: 0,
    followersCount: 0,
    followingCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('DismissFirstPostNudgeUseCase', () => {
  it('writes the dismissed flag through IUserRepository.update', async () => {
    const repo = new CapturingUserRepo();
    const uc = new DismissFirstPostNudgeUseCase(repo as unknown as IUserRepository);

    await uc.execute('u_abc');

    expect(repo.lastUpdateArgs).toEqual({
      userId: 'u_abc',
      patch: { firstPostNudgeDismissed: true },
    });
  });

  it('rejects an empty userId rather than writing to the wrong row', async () => {
    const repo = new CapturingUserRepo();
    const uc = new DismissFirstPostNudgeUseCase(repo as unknown as IUserRepository);

    await expect(uc.execute('')).rejects.toThrow(/userId is required/);
    expect(repo.lastUpdateArgs).toBeNull();
  });
});
