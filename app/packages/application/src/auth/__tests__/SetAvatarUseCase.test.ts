import { describe, expect, it } from 'vitest';
import { SetAvatarUseCase } from '../SetAvatarUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('SetAvatarUseCase', () => {
  const userId = 'user-1';
  const baseRow = {
    displayName: 'נווה',
    city: 'haifa',
    cityName: 'חיפה',
    onboardingState: 'pending_avatar' as const,
  };

  it('persists a valid https URL (FR-AUTH-011 AC1+AC2)', async () => {
    const repo = makeFakeUserRepo({ [userId]: baseRow });
    const useCase = new SetAvatarUseCase(repo);

    await useCase.execute({
      userId,
      avatarUrl: 'https://kc.supabase.co/storage/v1/object/public/avatars/user-1/avatar.jpg',
    });

    expect(repo.rows.get(userId)?.avatarUrl).toBe(
      'https://kc.supabase.co/storage/v1/object/public/avatars/user-1/avatar.jpg',
    );
  });

  it('persists null to clear the avatar (FR-AUTH-011 AC4 — Remove SSO photo)', async () => {
    const repo = makeFakeUserRepo({ [userId]: { ...baseRow, avatarUrl: 'https://old.example/p.jpg' } });
    const useCase = new SetAvatarUseCase(repo);

    await useCase.execute({ userId, avatarUrl: null });

    expect(repo.rows.get(userId)?.avatarUrl).toBeNull();
  });

  it('rejects empty userId', async () => {
    const repo = makeFakeUserRepo();
    const useCase = new SetAvatarUseCase(repo);

    await expect(useCase.execute({ userId: '   ', avatarUrl: null })).rejects.toThrow('invalid_user_id');
  });

  it('rejects non-http URLs', async () => {
    const repo = makeFakeUserRepo({ [userId]: baseRow });
    const useCase = new SetAvatarUseCase(repo);

    await expect(
      useCase.execute({ userId, avatarUrl: 'file:///tmp/bad.jpg' }),
    ).rejects.toThrow('invalid_avatar_url');
  });

  it('rejects empty/whitespace URL string (use null to clear)', async () => {
    const repo = makeFakeUserRepo({ [userId]: baseRow });
    const useCase = new SetAvatarUseCase(repo);

    await expect(useCase.execute({ userId, avatarUrl: '   ' })).rejects.toThrow('invalid_avatar_url');
  });
});
