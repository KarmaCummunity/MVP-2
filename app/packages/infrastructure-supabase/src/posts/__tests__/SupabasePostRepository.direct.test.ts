import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PostError } from '@kc/application';
import { SupabasePostRepository } from '../SupabasePostRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
  rpc?: { error?: { message: string; code?: string } | null };
}

function makeFakeClient(opts: FakeOpts = {}): {
  client: SupabaseClient<any>;
  ops: Array<{ kind: string; args?: unknown[] }>;
  rpcCalls: Array<{ name: string; params: any }>;
} {
  const ops: Array<{ kind: string; args?: unknown[] }> = [];
  const rpcCalls: Array<{ name: string; params: any }> = [];
  // Tables that always return an empty array under this fake (auxiliary reads
  // such as the FR-POST-021 actor-identity projection batch). Without this the
  // shared `data` payload bleeds into every join the repo issues.
  const ARRAY_RETURN_TABLES = new Set(['post_actor_identity']);
  let currentTable: string | null = null;
  const result = () => {
    if (currentTable && ARRAY_RETURN_TABLES.has(currentTable)) {
      return { data: [], error: null, count: 0 };
    }
    return {
      data: opts.data ?? null,
      error: opts.error ?? null,
      count: opts.count ?? null,
    };
  };
  function makeChain(): any {
    return new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(result()).then(onFulfilled, onRejected);
        }
        return (...args: any[]) => {
          ops.push({ kind: prop, args });
          return makeChain();
        };
      },
    });
  }
  const client = {
    from: (table: string) => {
      currentTable = table;
      ops.push({ kind: 'from', args: [table] });
      return makeChain();
    },
    rpc: (name: string, params: any) => {
      rpcCalls.push({ name, params });
      return Promise.resolve({ data: null, error: opts.rpc?.error ?? null });
    },
  } as unknown as SupabaseClient<any>;
  return { client, ops, rpcCalls };
}

function postRow(post_id: string): any {
  return {
    post_id, owner_id: 'u_1', type: 'Give', status: 'open', visibility: 'Public',
    title: 't', description: null, category: 'Other', city: 'IL-001',
    street: null, street_number: null, location_display_level: 'CityOnly',
    item_condition: 'Good', urgency: null, reopen_count: 0, delete_after: null,
    created_at: '2026-05-16T12:00:00.000Z', updated_at: '2026-05-16T12:00:00.000Z',
    owner: { user_id: 'u_1', display_name: 'A', share_handle: 'a', avatar_url: null, privacy_mode: 'Public' },
  };
}

describe('SupabasePostRepository.findById', () => {
  it('returns null when no row matched (maybeSingle → data:null)', async () => {
    const { client } = makeFakeClient({ data: null });
    const repo = new SupabasePostRepository(client);
    expect(await repo.findById('p_missing', null)).toBeNull();
  });

  it('throws "findById: <msg>" when the query errors', async () => {
    const { client } = makeFakeClient({ error: { message: 'rls denied' } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.findById('p_1', null)).rejects.toThrow('findById: rls denied');
  });

  it('maps the joined row through mapPostWithOwnerRow on success', async () => {
    const { client } = makeFakeClient({ data: postRow('p_1') });
    const repo = new SupabasePostRepository(client);
    const out = await repo.findById('p_1', null);
    expect(out?.postId).toBe('p_1');
    expect(out?.ownerHandle).toBe('a');
  });
});

describe('SupabasePostRepository.delete', () => {
  it('throws PostError("post_owner_delete_forbidden") when no row was deleted (RLS denied silently)', async () => {
    // PostgREST returns 200 + [] when DELETE matches no row under RLS.
    const { client } = makeFakeClient({ data: [] });
    const repo = new SupabasePostRepository(client);
    await expect(repo.delete('p_1')).rejects.toBeInstanceOf(PostError);
    await expect(repo.delete('p_1')).rejects.toMatchObject({ code: 'post_owner_delete_forbidden' });
  });

  it('throws "delete: <msg>" when the DELETE itself errors', async () => {
    const { client } = makeFakeClient({ error: { message: 'pg connection lost' } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.delete('p_1')).rejects.toThrow('delete: pg connection lost');
  });

  it('resolves silently when DELETE returns the deleted row (happy path)', async () => {
    const { client } = makeFakeClient({ data: [{ post_id: 'p_1' }] });
    const repo = new SupabasePostRepository(client);
    await expect(repo.delete('p_1')).resolves.toBeUndefined();
  });
});

describe('SupabasePostRepository.adminRemove', () => {
  it('calls admin_remove_post RPC with the post id and resolves on success', async () => {
    const { client, rpcCalls } = makeFakeClient();
    const repo = new SupabasePostRepository(client);
    await expect(repo.adminRemove('p_1')).resolves.toBeUndefined();
    expect(rpcCalls).toEqual([{ name: 'admin_remove_post', params: { p_post_id: 'p_1' } }]);
  });

  it('maps Postgres errcode 42501 (insufficient_privilege) to PostError("forbidden")', async () => {
    const { client } = makeFakeClient({ rpc: { error: { code: '42501', message: 'insufficient_privilege' } } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.adminRemove('p_1')).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('maps any error whose message matches /forbidden/i to PostError("forbidden")', async () => {
    const { client } = makeFakeClient({ rpc: { error: { message: 'Operation Forbidden by policy' } } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.adminRemove('p_1')).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('falls through to a generic "adminRemove: <msg>" for non-forbidden errors', async () => {
    const { client } = makeFakeClient({ rpc: { error: { code: '23505', message: 'duplicate key' } } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.adminRemove('p_1')).rejects.toThrow('adminRemove: duplicate key');
  });
});

describe('SupabasePostRepository.unmrkRecipientSelf', () => {
  it('calls rpc_recipient_unmark_self with the post id and resolves on success', async () => {
    const { client, rpcCalls } = makeFakeClient();
    const repo = new SupabasePostRepository(client);
    await expect(repo.unmrkRecipientSelf('p_1')).resolves.toBeUndefined();
    expect(rpcCalls).toEqual([{ name: 'rpc_recipient_unmark_self', params: { p_post_id: 'p_1' } }]);
  });

  it('throws "unmrkRecipientSelf: <msg>" on RPC error', async () => {
    const { client } = makeFakeClient({ rpc: { error: { message: 'not in chat' } } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.unmrkRecipientSelf('p_1')).rejects.toThrow('unmrkRecipientSelf: not in chat');
  });
});

describe('SupabasePostRepository.countOpenByUser', () => {
  it('returns the count from a head-only SELECT filtered to owner+status=open', async () => {
    const { client, ops } = makeFakeClient({ count: 7 });
    const repo = new SupabasePostRepository(client);
    expect(await repo.countOpenByUser('u_1')).toBe(7);
    const eqs = ops.filter((o) => o.kind === 'eq').map((o) => o.args);
    expect(eqs).toEqual([['owner_id', 'u_1'], ['status', 'open']]);
  });

  it('coalesces a null count to 0', async () => {
    const { client } = makeFakeClient({ count: null });
    const repo = new SupabasePostRepository(client);
    expect(await repo.countOpenByUser('u_1')).toBe(0);
  });

  it('throws "countOpenByUser: <msg>" on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'pg down' } });
    const repo = new SupabasePostRepository(client);
    await expect(repo.countOpenByUser('u_1')).rejects.toThrow('countOpenByUser: pg down');
  });
});
