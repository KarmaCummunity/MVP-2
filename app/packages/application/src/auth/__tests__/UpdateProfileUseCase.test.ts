import { describe, expect, it } from 'vitest';
import { UpdateProfileUseCase } from '../UpdateProfileUseCase';
import { makeFakeUserRepo } from './onboardingFakeUserRepository';

const seed = () =>
  makeFakeUserRepo({
    'u-1': {
      displayName: 'נוה',
      city: 'tel-aviv',
      cityName: 'תל אביב',
      onboardingState: 'completed',
      biography: null,
    },
  });

describe('UpdateProfileUseCase', () => {
  it('updates display_name + city + biography + avatar in one go', async () => {
    const repo = seed();
    const uc = new UpdateProfileUseCase(repo);
    await uc.execute({
      userId: 'u-1',
      displayName: 'נוה ע',
      city: 'haifa',
      cityName: 'חיפה',
      biography: 'אוהב לתת',
      avatarUrl: 'https://example.com/a.jpg',
    });
    const row = repo.rows.get('u-1');
    expect(row?.displayName).toBe('נוה ע');
    expect(row?.city).toBe('haifa');
    expect(row?.biography).toBe('אוהב לתת');
    expect(row?.avatarUrl).toBe('https://example.com/a.jpg');
  });

  it('rejects display_name that is whitespace-only or longer than 50 chars', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(uc.execute({ userId: 'u-1', displayName: '   ' })).rejects.toThrow('invalid_display_name');
    await expect(
      uc.execute({ userId: 'u-1', displayName: 'a'.repeat(51) }),
    ).rejects.toThrow('invalid_display_name');
  });

  it('rejects biography longer than 200 chars', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(
      uc.execute({ userId: 'u-1', biography: 'x'.repeat(201) }),
    ).rejects.toThrow('biography_too_long');
  });

  it('rejects biography that contains a URL (FR-PROFILE-007 AC3)', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(
      uc.execute({ userId: 'u-1', biography: 'follow me at https://x.com/me' }),
    ).rejects.toThrow('biography_url_forbidden');
    await expect(
      uc.execute({ userId: 'u-1', biography: 'visit www.spam.co' }),
    ).rejects.toThrow('biography_url_forbidden');
  });

  it('rejects city without cityName (and vice versa) — pair must be supplied together', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(uc.execute({ userId: 'u-1', city: 'haifa' })).rejects.toThrow('city_pair_required');
    await expect(uc.execute({ userId: 'u-1', cityName: 'חיפה' })).rejects.toThrow('city_pair_required');
  });

  it('rejects empty patch', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(uc.execute({ userId: 'u-1' })).rejects.toThrow('empty_patch');
  });

  it('clears biography when given null (kept the user can blank it out)', async () => {
    const repo = seed();
    repo.rows.set('u-1', {
      ...repo.rows.get('u-1')!,
      biography: 'old bio',
    });
    const uc = new UpdateProfileUseCase(repo);
    await uc.execute({ userId: 'u-1', biography: null });
    expect(repo.rows.get('u-1')?.biography).toBeNull();
  });

  it('updates only avatar when given just avatarUrl', async () => {
    const repo = seed();
    const uc = new UpdateProfileUseCase(repo);
    await uc.execute({ userId: 'u-1', avatarUrl: 'https://example.com/new.jpg' });
    expect(repo.rows.get('u-1')?.avatarUrl).toBe('https://example.com/new.jpg');
    expect(repo.rows.get('u-1')?.displayName).toBe('נוה'); // unchanged
  });

  it('updates only profile address lines when given just profileAddress', async () => {
    const repo = seed();
    const uc = new UpdateProfileUseCase(repo);
    await uc.execute({
      userId: 'u-1',
      profileAddress: { street: 'רוטשילד', streetNumber: '22' },
    });
    expect(repo.rows.get('u-1')?.profileStreet).toBe('רוטשילד');
    expect(repo.rows.get('u-1')?.profileStreetNumber).toBe('22');
    expect(repo.rows.get('u-1')?.displayName).toBe('נוה');
  });

  it('clears profile address when profileAddress is null pair', async () => {
    const repo = seed();
    repo.rows.set('u-1', {
      ...repo.rows.get('u-1')!,
      profileStreet: 'רחוב',
      profileStreetNumber: '1',
    });
    const uc = new UpdateProfileUseCase(repo);
    await uc.execute({ userId: 'u-1', profileAddress: { street: null, streetNumber: null } });
    expect(repo.rows.get('u-1')?.profileStreet).toBeNull();
    expect(repo.rows.get('u-1')?.profileStreetNumber).toBeNull();
  });

  it('rejects incomplete profile address (one field empty)', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(
      uc.execute({ userId: 'u-1', profileAddress: { street: 'רחוב', streetNumber: null } }),
    ).rejects.toThrow('incomplete_profile_address');
  });

  it('rejects invalid profile street number', async () => {
    const uc = new UpdateProfileUseCase(seed());
    await expect(
      uc.execute({ userId: 'u-1', profileAddress: { street: 'רחוב', streetNumber: 'abc' } }),
    ).rejects.toThrow('invalid_profile_street_number');
  });
});
