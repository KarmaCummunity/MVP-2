import { describe, it, expect } from 'vitest';
import { UpdatePrivacyModeUseCase } from '../UpdatePrivacyModeUseCase';
import { FollowFakeUserRepository, makeUser } from './followFakeUserRepository';

describe('UpdatePrivacyModeUseCase', () => {
  it('flips Public → Private and returns updated user', async () => {
    const repo = new FollowFakeUserRepository();
    repo.user = makeUser({ privacyMode: 'Public' });
    repo.setPrivacyModeResult = makeUser({ privacyMode: 'Private', privacyChangedAt: '2026-05-10T00:00:00Z' });
    const uc = new UpdatePrivacyModeUseCase(repo);

    const out = await uc.execute({ userId: 'u_test', mode: 'Private' });

    expect(repo.lastSetPrivacyMode).toEqual({ userId: 'u_test', mode: 'Private' });
    expect(out.user.privacyMode).toBe('Private');
  });

  it('no-ops when mode === current', async () => {
    const repo = new FollowFakeUserRepository();
    repo.user = makeUser({ privacyMode: 'Public' });
    const uc = new UpdatePrivacyModeUseCase(repo);

    const out = await uc.execute({ userId: 'u_test', mode: 'Public' });

    expect(repo.lastSetPrivacyMode).toBeNull();
    expect(out.user.privacyMode).toBe('Public');
  });

  it('throws user_not_found if user is missing', async () => {
    const repo = new FollowFakeUserRepository();
    repo.user = null;
    const uc = new UpdatePrivacyModeUseCase(repo);

    await expect(
      uc.execute({ userId: 'u_test', mode: 'Private' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });
});
