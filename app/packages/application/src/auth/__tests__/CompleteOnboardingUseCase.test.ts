import { describe, expect, it } from 'vitest';
import { CompleteOnboardingUseCase } from '../CompleteOnboardingUseCase';
import { OnboardingError } from '../errors';
import { makeFakeUserRepo } from './onboardingFakeUserRepository';

describe('CompleteOnboardingUseCase', () => {
  const userId = 'user-1';

  it('flips onboarding_state to completed (FR-AUTH-012 AC3)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'נווה',
        city: 'haifa',
        cityName: 'חיפה',
        onboardingState: 'pending_avatar',
      },
    });
    const useCase = new CompleteOnboardingUseCase(repo);

    await useCase.execute({ userId });

    expect(repo.rows.get(userId)?.onboardingState).toBe('completed');
  });

  it('is idempotent — re-running on a completed user is a no-op', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'נווה',
        city: 'haifa',
        cityName: 'חיפה',
        onboardingState: 'completed',
      },
    });
    const useCase = new CompleteOnboardingUseCase(repo);

    await useCase.execute({ userId });

    expect(repo.rows.get(userId)?.onboardingState).toBe('completed');
  });

  it('throws OnboardingError when invoked while still in pending_basic_info (audit §17.3)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'נווה',
        city: 'haifa',
        cityName: 'חיפה',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteOnboardingUseCase(repo);

    await expect(useCase.execute({ userId })).rejects.toMatchObject({
      name: 'OnboardingError',
      code: 'illegal_transition',
    } satisfies Partial<OnboardingError>);
    expect(repo.rows.get(userId)?.onboardingState).toBe('pending_basic_info');
  });
});
