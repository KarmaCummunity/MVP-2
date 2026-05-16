import { describe, expect, it } from 'vitest';
import { CompleteBasicInfoUseCase } from '../CompleteBasicInfoUseCase';
import { OnboardingError } from '../errors';
import { makeFakeUserRepo } from './onboardingFakeUserRepository';

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
      basicInfoSkipped: false,
      profileStreet: null,
      profileStreetNumber: null,
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

  it('persists optional profile street + number (FR-PROFILE-007 shape)', async () => {
    const repo = seed();
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({
      userId,
      displayName: 'נווה',
      cityId: '4000',
      cityName: 'חיפה',
      profileStreet: '  הרצל ',
      profileStreetNumber: ' 12 ',
    });

    expect(repo.rows.get(userId)).toMatchObject({
      displayName: 'נווה',
      city: '4000',
      cityName: 'חיפה',
      profileStreet: 'הרצל',
      profileStreetNumber: '12',
      onboardingState: 'pending_avatar',
    });
  });

  it('rejects street without number', async () => {
    const useCase = new CompleteBasicInfoUseCase(seed());

    await expect(
      useCase.execute({
        userId,
        displayName: 'נווה',
        cityId: '4000',
        cityName: 'חיפה',
        profileStreet: 'הרצל',
        profileStreetNumber: '',
      }),
    ).rejects.toThrow('incomplete_profile_address');
  });

  it('accepts profile street number with Hebrew letter suffix (audit §3.1)', async () => {
    const repo = seed();
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({
      userId,
      displayName: 'נווה',
      cityId: '4000',
      cityName: 'חיפה',
      profileStreet: 'הרצל',
      profileStreetNumber: '12א',
    });

    expect(repo.rows.get(userId)?.profileStreetNumber).toBe('12א');
  });

  it('rejects profile street number with punctuation (FR-PROFILE-007)', async () => {
    const useCase = new CompleteBasicInfoUseCase(seed());

    await expect(
      useCase.execute({
        userId,
        displayName: 'נווה',
        cityId: '4000',
        cityName: 'חיפה',
        profileStreet: 'הרצל',
        profileStreetNumber: '12/3',
      }),
    ).rejects.toThrow('invalid_profile_street_number');
  });

  it('throws OnboardingError when invoked on a completed user (audit §17.3)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'placeholder',
        city: '5000',
        cityName: 'תל אביב - יפו',
        onboardingState: 'completed',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: 'חיפה' }),
    ).rejects.toMatchObject({
      name: 'OnboardingError',
      code: 'illegal_transition',
    } satisfies Partial<OnboardingError>);
  });

  it('is idempotent — accepts a pending_avatar user re-running step 1', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'placeholder',
        city: '5000',
        cityName: 'תל אביב - יפו',
        onboardingState: 'pending_avatar',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: 'חיפה' });

    expect(repo.rows.get(userId)?.onboardingState).toBe('pending_avatar');
  });
});
