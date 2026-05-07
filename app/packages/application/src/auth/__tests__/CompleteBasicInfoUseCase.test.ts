import { describe, expect, it } from 'vitest';
import { CompleteBasicInfoUseCase } from '../CompleteBasicInfoUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('CompleteBasicInfoUseCase', () => {
  const userId = 'user-1';

  const seed = () =>
    makeFakeUserRepo({
      [userId]: {
        displayName: 'placeholder',
        city: '5000',
        cityName: 'תל אביב - יפו',
        onboardingState: 'pending_basic_info',
      },
    });

  it('persists trimmed display_name + city + city_name and advances state to pending_avatar', async () => {
    const repo = seed();
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({
      userId,
      displayName: '  נווה  ',
      cityId: '4000',
      cityName: 'חיפה',
    });

    expect(repo.rows.get(userId)).toEqual({
      displayName: 'נווה',
      city: '4000',
      cityName: 'חיפה',
      onboardingState: 'pending_avatar',
    });
  });

  it('rejects whitespace-only display_name (FR-AUTH-010 AC1)', async () => {
    const useCase = new CompleteBasicInfoUseCase(seed());

    await expect(
      useCase.execute({ userId, displayName: '   ', cityId: '4000', cityName: 'חיפה' }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects display_name longer than 50 chars (FR-AUTH-010 AC1)', async () => {
    const useCase = new CompleteBasicInfoUseCase(seed());

    await expect(
      useCase.execute({
        userId,
        displayName: 'a'.repeat(51),
        cityId: '4000',
        cityName: 'חיפה',
      }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects empty cityId or cityName (boundary input from picker)', async () => {
    const useCase = new CompleteBasicInfoUseCase(seed());

    await expect(
      useCase.execute({ userId, displayName: 'נווה', cityId: '', cityName: 'חיפה' }),
    ).rejects.toThrowError(/city/);

    await expect(
      useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: '   ' }),
    ).rejects.toThrowError(/city/);
  });
});
