import { describe, expect, it } from 'vitest';
import { CompleteOnboardingUseCase } from '../CompleteOnboardingUseCase';
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
});
