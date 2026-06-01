import { describe, expect, it, vi } from 'vitest';
import { AdminRoleError, type GrantableAdminRole } from '@kc/domain';
import { GrantAdminRoleUseCase } from '../GrantAdminRoleUseCase';
import type { IAdminRoleRepository } from '../IAdminRoleRepository';

function fakeRepo(opts: { grantId?: string; grantRoleError?: Error } = {}): IAdminRoleRepository {
  return {
    getMyRoles: vi.fn(),
    listAdmins: vi.fn(),
    grantRole: vi.fn(async () => {
      if (opts.grantRoleError) throw opts.grantRoleError;
      return opts.grantId ?? 'g1';
    }),
    revokeRole: vi.fn(),
  };
}

describe('GrantAdminRoleUseCase', () => {
  it('returns grant_id from repository for valid moderator grant', async () => {
    const uc = new GrantAdminRoleUseCase(fakeRepo({ grantId: 'grant-abc' }));
    const out = await uc.execute({ targetUserId: 'user-1', role: 'moderator' });
    expect(out).toBe('grant-abc');
  });

  it('passes through for support role', async () => {
    const repo = fakeRepo({ grantId: 'g2' });
    const uc = new GrantAdminRoleUseCase(repo);
    await uc.execute({ targetUserId: 'user-2', role: 'support' });
    expect(repo.grantRole).toHaveBeenCalledWith('user-2', 'support');
  });

  it('throws invalid_input when targetUserId is empty', async () => {
    const uc = new GrantAdminRoleUseCase(fakeRepo());
    await expect(uc.execute({ targetUserId: '', role: 'moderator' })).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });

  it('throws invalid_role when role is not grantable from UI', async () => {
    const uc = new GrantAdminRoleUseCase(fakeRepo());
    await expect(
      uc.execute({ targetUserId: 'u', role: 'super_admin' as unknown as GrantableAdminRole }),
    ).rejects.toMatchObject({ code: 'invalid_role' });
  });

  it('propagates repository AdminRoleError unchanged', async () => {
    const err = new AdminRoleError('role_already_active');
    const uc = new GrantAdminRoleUseCase(fakeRepo({ grantRoleError: err }));
    await expect(uc.execute({ targetUserId: 'u', role: 'moderator' })).rejects.toBe(err);
  });

  it('does not call repo when input fails validation', async () => {
    const repo = fakeRepo();
    const uc = new GrantAdminRoleUseCase(repo);
    await expect(uc.execute({ targetUserId: '', role: 'moderator' })).rejects.toBeInstanceOf(AdminRoleError);
    expect(repo.grantRole).not.toHaveBeenCalled();
  });
});

