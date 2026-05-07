import { describe, expect, it } from 'vitest';
import { CompleteBasicInfoUseCase } from '../CompleteBasicInfoUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('CompleteBasicInfoUseCase', () => {
  const userId = 'user-1';

  it('persists trimmed display_name + city + city_name and advances state to pending_avatar', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'placeholder',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({ userId, displayName: '  נווה  ', cityId: 'haifa' });

    expect(repo.rows.get(userId)).toEqual({
      displayName: 'נווה',
      city: 'haifa',
      cityName: 'חיפה',
      onboardingState: 'pending_avatar',
    });
  });

  it('rejects whitespace-only display_name (FR-AUTH-010 AC1)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: '   ', cityId: 'haifa' }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects display_name longer than 50 chars (FR-AUTH-010 AC1)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: 'a'.repeat(51), cityId: 'haifa' }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects unknown city_id (FR-AUTH-010 AC2)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: 'נווה', cityId: 'narnia' }),
    ).rejects.toThrowError(/city/);
  });
});
