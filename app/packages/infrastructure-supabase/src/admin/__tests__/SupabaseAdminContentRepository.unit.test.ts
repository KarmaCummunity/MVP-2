import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAdminContentError } from '@kc/domain';
import { SupabaseAdminContentRepository } from '../SupabaseAdminContentRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

describe('SupabaseAdminContentRepository — searchUsers', () => {
  it('maps rows + reads total_count from the first row', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({
        data: [
          {
            user_id: 'u1', display_name: 'A', share_handle: 'a',
            account_status: 'active', city_name: null,
            created_at: '2026-01-01T00:00:00.000Z', last_seen_at: null,
            total_count: 1,
          },
        ],
        error: null,
      })),
    );
    const page = await repo.searchUsers({ query: 'A' });
    expect(page.rows).toHaveLength(1);
    expect(page.totalCount).toBe(1);
    expect(page.rows[0]?.createdAt).toBeInstanceOf(Date);
  });

  it('returns totalCount 0 on empty data', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({ data: [], error: null })),
    );
    const page = await repo.searchUsers({});
    expect(page.rows).toEqual([]);
    expect(page.totalCount).toBe(0);
  });

  it('parses total_count when returned as a string (Postgres bigint)', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({
        data: [
          {
            user_id: 'u1', display_name: null, share_handle: null,
            account_status: 'banned', city_name: null,
            created_at: '2026-01-01T00:00:00.000Z', last_seen_at: null,
            total_count: '17',
          },
        ],
        error: null,
      })),
    );
    const page = await repo.searchUsers({});
    expect(page.totalCount).toBe(17);
  });

  it('maps forbidden by message', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({ data: null, error: { message: 'forbidden', code: '42501' } })),
    );
    const err = await repo.searchUsers({}).catch((e) => e);
    expect(isAdminContentError(err)).toBe(true);
    expect(err.code).toBe('forbidden');
  });

  it('maps invalid_status by message', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_status', code: '22023' } })),
    );
    await expect(repo.searchUsers({ status: 'limbo' })).rejects.toMatchObject({
      code: 'invalid_status',
    });
  });
});

describe('SupabaseAdminContentRepository — searchPosts', () => {
  it('maps rows + timestamps', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({
        data: [
          {
            post_id: 'p1', title: 'help', type: 'request', status: 'open',
            visibility: 'Public', owner_id: 'u1', owner_display_name: 'A',
            created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
            total_count: 1,
          },
        ],
        error: null,
      })),
    );
    const page = await repo.searchPosts({});
    expect(page.rows[0]).toMatchObject({ postId: 'p1', title: 'help' });
    expect(page.rows[0]?.updatedAt).toBeInstanceOf(Date);
  });
});

describe('SupabaseAdminContentRepository — searchAudit', () => {
  it('maps rows + metadata default to empty object when null', async () => {
    const repo = new SupabaseAdminContentRepository(
      mockClient(() => ({
        data: [
          {
            event_id: 'e1', actor_id: 'u-a', actor_display_name: 'A',
            action: 'ban_user', target_type: 'user', target_id: 'u-t',
            target_display_name: 'T', metadata: null,
            created_at: '2026-01-01T00:00:00.000Z',
            total_count: 1,
          },
        ],
        error: null,
      })),
    );
    const page = await repo.searchAudit({});
    expect(page.rows[0]?.metadata).toEqual({});
    expect(page.rows[0]?.action).toBe('ban_user');
  });

  it('passes filters through to the RPC', async () => {
    const spy = vi.fn(() => ({ data: [], error: null }));
    const repo = new SupabaseAdminContentRepository(mockClient(spy as never));
    await repo.searchAudit({ actorId: 'u1', action: 'dismiss_report', limit: 10, offset: 0 });
    expect(spy).toHaveBeenCalledWith('admin_audit_search', {
      p_target_user_id: null,
      p_actor_id: 'u1',
      p_action: 'dismiss_report',
      p_limit: 10,
      p_offset: 0,
      p_from: null,
      p_to: null,
    });
  });

  it('serialises fromDate / toDate as ISO strings', async () => {
    const spy = vi.fn(() => ({ data: [], error: null }));
    const repo = new SupabaseAdminContentRepository(mockClient(spy as never));
    await repo.searchAudit({
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate:   new Date('2026-05-08T23:59:59.999Z'),
    });
    const calls = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const args = (calls[0]?.[1] ?? {}) as Record<string, unknown>;
    expect(args['p_from']).toBe('2026-05-01T00:00:00.000Z');
    expect(args['p_to']).toBe('2026-05-08T23:59:59.999Z');
  });
});
