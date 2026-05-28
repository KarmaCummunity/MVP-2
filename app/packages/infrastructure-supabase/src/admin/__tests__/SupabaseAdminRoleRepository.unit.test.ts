import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AdminRoleError, isAdminRoleError } from '@kc/domain';
import { SupabaseAdminRoleRepository } from '../SupabaseAdminRoleRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

describe('SupabaseAdminRoleRepository — RPC error mapping', () => {
  it('grantRole returns grant_id on success', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: 'grant-1', error: null })),
    );
    expect(await repo.grantRole('user-1', 'moderator')).toBe('grant-1');
  });

  it('grantRole maps role_already_active by message', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'role_already_active', code: '23505' } })),
    );
    await expect(repo.grantRole('u1', 'moderator')).rejects.toMatchObject({
      code: 'role_already_active',
    });
  });

  it('grantRole maps target_not_found by message', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'target_not_found', code: 'P0002' } })),
    );
    await expect(repo.grantRole('u1', 'moderator')).rejects.toMatchObject({
      code: 'target_not_found',
    });
  });

  it('grantRole maps forbidden by SQLSTATE when message is opaque', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'something went wrong', code: '42501' } })),
    );
    await expect(repo.grantRole('u1', 'moderator')).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('grantRole falls back to unknown on unrecognized error', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'weird', code: '99999' } })),
    );
    await expect(repo.grantRole('u1', 'moderator')).rejects.toMatchObject({
      code: 'unknown',
    });
  });

  it('revokeRole resolves to void on success', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    await expect(repo.revokeRole('g1')).resolves.toBeUndefined();
  });

  it('revokeRole maps cannot_revoke_last_super_admin', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({
        data: null,
        error: { message: 'cannot_revoke_last_super_admin', code: 'P0001' },
      })),
    );
    const err = await repo.revokeRole('g1').catch((e) => e);
    expect(isAdminRoleError(err)).toBe(true);
    expect((err as AdminRoleError).code).toBe('cannot_revoke_last_super_admin');
  });

  it('revokeRole maps grant_not_found', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'grant_not_found', code: 'P0002' } })),
    );
    await expect(repo.revokeRole('g1')).rejects.toMatchObject({ code: 'grant_not_found' });
  });

  it('listAdmins returns mapped entities + parses timestamps', async () => {
    const row = {
      grant_id: 'g1',
      user_id: 'u1',
      display_name: 'Alice',
      avatar_url: null,
      role: 'moderator',
      granted_at: '2026-01-01T00:00:00.000Z',
      granted_by: 'super-1',
      granted_by_display_name: 'Root',
      revoked_at: null,
      revoked_by: null,
      last_seen_at: '2026-01-02T00:00:00.000Z',
    };
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: [row], error: null })),
    );
    const out = await repo.listAdmins(false);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      grantId: 'g1',
      userId: 'u1',
      role: 'moderator',
      displayName: 'Alice',
      revokedAt: null,
    });
    expect(out[0]?.grantedAt).toBeInstanceOf(Date);
    expect(out[0]?.lastSeenAt).toBeInstanceOf(Date);
  });

  it('listAdmins drops rows with unparseable role', async () => {
    const row = {
      grant_id: 'g1',
      user_id: 'u1',
      display_name: 'X',
      avatar_url: null,
      role: 'not_a_real_role',
      granted_at: '2026-01-01T00:00:00.000Z',
      granted_by: null,
      granted_by_display_name: null,
      revoked_at: null,
      revoked_by: null,
      last_seen_at: null,
    };
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: [row], error: null })),
    );
    expect(await repo.listAdmins(false)).toEqual([]);
  });

  it('listAdmins maps forbidden by SQLSTATE', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: { message: 'permission denied', code: '42501' } })),
    );
    await expect(repo.listAdmins(false)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('listAdmins returns empty array on null data', async () => {
    const repo = new SupabaseAdminRoleRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    expect(await repo.listAdmins(false)).toEqual([]);
  });
});
