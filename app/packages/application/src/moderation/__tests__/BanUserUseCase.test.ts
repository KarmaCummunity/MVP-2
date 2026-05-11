import { describe, it, expect } from 'vitest';
import { BanUserUseCase } from '../BanUserUseCase';
import { ModerationError } from '../errors';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('BanUserUseCase', () => {
  it('forwards userId, reason, note to repo.banUser on happy path', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new BanUserUseCase(repo);

    await uc.execute({
      adminId: 'u_admin',
      targetUserId: 'u_target',
      reason: 'spam',
      note: 'repeated spam',
    });

    expect(repo.banCalls).toEqual([
      { userId: 'u_target', reason: 'spam', note: 'repeated spam' },
    ]);
  });

  it('rejects self-ban with cannot_ban_self and does NOT call banUser', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new BanUserUseCase(repo);

    await expect(
      uc.execute({
        adminId: 'u_same',
        targetUserId: 'u_same',
        reason: 'spam',
        note: '',
      }),
    ).rejects.toMatchObject({
      name: 'ModerationError',
      code: 'cannot_ban_self',
    });

    expect(repo.banCalls).toEqual([]);
  });

  it('rejects banning another admin with cannot_ban_admin and does NOT call banUser', async () => {
    const repo = new FakeModerationAdminRepository();
    repo.adminIds.add('u_other_admin');
    const uc = new BanUserUseCase(repo);

    await expect(
      uc.execute({
        adminId: 'u_admin',
        targetUserId: 'u_other_admin',
        reason: 'policy_violation',
        note: '',
      }),
    ).rejects.toBeInstanceOf(ModerationError);
    await expect(
      uc.execute({
        adminId: 'u_admin',
        targetUserId: 'u_other_admin',
        reason: 'policy_violation',
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'cannot_ban_admin' });

    expect(repo.banCalls).toEqual([]);
  });
});
