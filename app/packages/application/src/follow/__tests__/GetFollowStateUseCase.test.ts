import { describe, it, expect } from 'vitest';
import { GetFollowStateUseCase } from '../GetFollowStateUseCase';
import { FakeUserRepository } from './FakeUserRepository';

const baseRaw = {
  target: { userId: 'u_target', privacyMode: 'Public' as const, accountStatus: 'active' as const },
  followingExists: false,
  pendingRequestExists: false,
  cooldownUntil: null,
  blocked: false,
};

describe('GetFollowStateUseCase', () => {
  it('returns "self" when viewer === target', async () => {
    const repo = new FakeUserRepository();
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_a' });
    expect(out.state).toBe('self');
  });

  it('returns "blocked" when bilateral block exists', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, blocked: true };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('blocked');
  });

  it('returns "not_following_public" for a public target with no edge', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('not_following_public');
  });

  it('returns "following" when edge exists (regardless of privacy mode)', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, followingExists: true };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('following');
  });

  it('returns "not_following_private_no_request" for private target with no edge / pending / cooldown', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' as const },
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('not_following_private_no_request');
  });

  it('returns "request_pending" when a pending request exists', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' as const },
      pendingRequestExists: true,
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('request_pending');
  });

  it('returns "cooldown_after_reject" with cooldownUntil when active', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, privacyMode: 'Private' as const },
      cooldownUntil: '2026-06-01T00:00:00Z',
    };
    const uc = new GetFollowStateUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' });
    expect(out.state).toBe('cooldown_after_reject');
    expect(out.cooldownUntil).toBe('2026-06-01T00:00:00Z');
  });

  it('throws user_not_found when target is null', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = { ...baseRaw, target: null };
    const uc = new GetFollowStateUseCase(repo);
    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });

  it('throws user_not_found when target is suspended', async () => {
    const repo = new FakeUserRepository();
    repo.followStateRaw = {
      ...baseRaw,
      target: { ...baseRaw.target!, accountStatus: 'suspended' as const },
    };
    const uc = new GetFollowStateUseCase(repo);
    await expect(
      uc.execute({ viewerId: 'u_a', targetUserId: 'u_b' }),
    ).rejects.toMatchObject({ code: 'user_not_found' });
  });
});
