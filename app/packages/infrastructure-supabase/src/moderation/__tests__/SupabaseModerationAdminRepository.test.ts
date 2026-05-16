import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  InvalidRestoreStateError,
  ModerationError,
  ModerationForbiddenError,
} from '@kc/application';
import { SupabaseModerationAdminRepository } from '../SupabaseModerationAdminRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  isAdminData?: { is_super_admin: boolean } | null;
  isAdminError?: { code?: string; message: string } | null;
  rpcError?: { code?: string; message: string } | null;
  auditData?: any[];
}
interface Calls { rpcs: { fn: string; args: unknown }[] }

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; calls: Calls } {
  const calls: Calls = { rpcs: [] };
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: opts.isAdminData ?? null,
            error: opts.isAdminError ?? null,
          }),
        }),
      }),
    }),
    rpc: async (fn: string, args: unknown) => {
      calls.rpcs.push({ fn, args });
      if (fn === 'admin_audit_lookup_guarded') {
        return { data: opts.auditData ?? [], error: opts.rpcError ?? null };
      }
      return { data: null, error: opts.rpcError ?? null };
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('SupabaseModerationAdminRepository — error mapping (SQLSTATE → typed error)', () => {
  // Parametrised over every entry in CODE_MAP. forbidden + invalid_restore_state
  // route to dedicated subclasses; the rest land on ModerationError(<code>).
  it.each([
    ['42501',     ModerationForbiddenError,    undefined],
    ['P0011',     InvalidRestoreStateError,    undefined],
    ['P0010',     ModerationError,             'invalid_target_type'],
    ['P0012',     ModerationError,             'report_not_open'],
    ['P0013',     ModerationError,             'cannot_ban_self'],
    ['P0014',     ModerationError,             'cannot_ban_admin'],
    ['P0015',     ModerationError,             'invalid_ban_reason'],
    ['P0016',     ModerationError,             'cannot_delete_system_message'],
    ['P0017',     ModerationError,             'target_not_found'],
  ])('SQLSTATE %s → expected typed error', async (code, ExpectedClass, expectedCode) => {
    const { client } = makeFakeClient({ rpcError: { code, message: 'rpc failed' } });
    const repo = new SupabaseModerationAdminRepository(client);
    try {
      await repo.dismissReport('r_1');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ExpectedClass);
      if (expectedCode) expect((err as ModerationError).code).toBe(expectedCode);
    }
  });

  it('unrecognised SQLSTATE → ModerationError("unknown")', async () => {
    const { client } = makeFakeClient({ rpcError: { code: '23000', message: 'mystery' } });
    await expect(
      new SupabaseModerationAdminRepository(client).dismissReport('r_1'),
    ).rejects.toMatchObject({ name: 'ModerationError', code: 'unknown' });
  });

  it('error with no code → ModerationError("unknown")', async () => {
    const { client } = makeFakeClient({ rpcError: { message: 'no code' } });
    await expect(
      new SupabaseModerationAdminRepository(client).dismissReport('r_1'),
    ).rejects.toMatchObject({ name: 'ModerationError', code: 'unknown' });
  });
});

describe('SupabaseModerationAdminRepository — isUserAdmin', () => {
  it('returns true when is_super_admin === true', async () => {
    const { client } = makeFakeClient({ isAdminData: { is_super_admin: true } });
    expect(await new SupabaseModerationAdminRepository(client).isUserAdmin('u_1')).toBe(true);
  });

  it('returns false when is_super_admin === false', async () => {
    const { client } = makeFakeClient({ isAdminData: { is_super_admin: false } });
    expect(await new SupabaseModerationAdminRepository(client).isUserAdmin('u_1')).toBe(false);
  });

  it('returns false when the row is missing (strict === true check)', async () => {
    const { client } = makeFakeClient({ isAdminData: null });
    expect(await new SupabaseModerationAdminRepository(client).isUserAdmin('u_1')).toBe(false);
  });

  it('routes query errors through the SQLSTATE mapper', async () => {
    const { client } = makeFakeClient({ isAdminError: { code: '42501', message: 'rls' } });
    await expect(new SupabaseModerationAdminRepository(client).isUserAdmin('u_1')).rejects.toBeInstanceOf(
      ModerationForbiddenError,
    );
  });
});

describe('SupabaseModerationAdminRepository — admin RPCs', () => {
  it('restoreTarget → admin_restore_target', async () => {
    const { client, calls } = makeFakeClient({});
    await new SupabaseModerationAdminRepository(client).restoreTarget('post', 'p_1');
    expect(calls.rpcs).toEqual([{ fn: 'admin_restore_target', args: { p_target_type: 'post', p_target_id: 'p_1' } }]);
  });

  it('dismissReport → admin_dismiss_report', async () => {
    const { client, calls } = makeFakeClient({});
    await new SupabaseModerationAdminRepository(client).dismissReport('r_1');
    expect(calls.rpcs).toEqual([{ fn: 'admin_dismiss_report', args: { p_report_id: 'r_1' } }]);
  });

  it('confirmReport → admin_confirm_report', async () => {
    const { client, calls } = makeFakeClient({});
    await new SupabaseModerationAdminRepository(client).confirmReport('r_1');
    expect(calls.rpcs).toEqual([{ fn: 'admin_confirm_report', args: { p_report_id: 'r_1' } }]);
  });

  it('banUser → admin_ban_user with user_id + reason + note', async () => {
    const { client, calls } = makeFakeClient({});
    await new SupabaseModerationAdminRepository(client).banUser('u_target', 'harassment', 'pattern');
    expect(calls.rpcs).toEqual([
      { fn: 'admin_ban_user', args: { p_target_user_id: 'u_target', p_reason: 'harassment', p_note: 'pattern' } },
    ]);
  });

  it('deleteMessage → admin_delete_message', async () => {
    const { client, calls } = makeFakeClient({});
    await new SupabaseModerationAdminRepository(client).deleteMessage('m_1');
    expect(calls.rpcs).toEqual([{ fn: 'admin_delete_message', args: { p_message_id: 'm_1' } }]);
  });
});

describe('SupabaseModerationAdminRepository — auditLookup', () => {
  it('calls admin_audit_lookup_guarded with p_user_id + p_limit (default 200)', async () => {
    const { client, calls } = makeFakeClient({ auditData: [] });
    await new SupabaseModerationAdminRepository(client).auditLookup('u_1');
    expect(calls.rpcs).toEqual([
      { fn: 'admin_audit_lookup_guarded', args: { p_user_id: 'u_1', p_limit: 200 } },
    ]);
  });

  it('forwards explicit limit verbatim', async () => {
    const { client, calls } = makeFakeClient({ auditData: [] });
    await new SupabaseModerationAdminRepository(client).auditLookup('u_1', 50);
    expect((calls.rpcs[0]?.args as { p_limit: number }).p_limit).toBe(50);
  });

  it('maps snake_case rows to AuditEvent shape with null/{}-coalesced defaults', async () => {
    const { client } = makeFakeClient({
      auditData: [
        {
          event_id: 'e_1',
          actor_id: 'u_admin',
          action: 'ban_user',
          target_type: 'user',
          target_id: 'u_t',
          metadata: { reason: 'abuse' },
          created_at: '2026-05-16T12:00:00.000Z',
        },
        {
          event_id: 'e_2', actor_id: null, action: 'confirm_report',
          target_type: null, target_id: null, metadata: null,
          created_at: '2026-05-16T11:00:00.000Z',
        },
      ],
    });
    const out = await new SupabaseModerationAdminRepository(client).auditLookup('u_1');
    expect(out[0]).toEqual({
      eventId: 'e_1', actorId: 'u_admin', action: 'ban_user',
      targetType: 'user', targetId: 'u_t',
      metadata: { reason: 'abuse' }, createdAt: '2026-05-16T12:00:00.000Z',
    });
    expect(out[1]).toMatchObject({ actorId: null, targetType: null, targetId: null, metadata: {} });
  });
});
