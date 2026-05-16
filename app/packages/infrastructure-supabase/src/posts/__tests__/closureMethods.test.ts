import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PostError } from '@kc/application';
import { closePost, reopenPost } from '../closureMethods';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion file closureMethods.candidates.test.ts covers
// getClosureCandidates (dedupe + sort logic) separately.

interface FakeOpts {
  rpcError?: { message: string } | null;
  postsUpdateData?: any[] | null;
  postsUpdateError?: { message: string } | null;
  postReadData?: { status: string; reopen_count: number } | null;
  postReadError?: { message: string } | null;
  postRereadData?: any | null;
}

function makeFakeClient(opts: FakeOpts): { client: SupabaseClient<any>; rpcs: { fn: string; args: any }[] } {
  const rpcs: { fn: string; args: any }[] = [];
  const updateResult = async () => ({ data: opts.postsUpdateData ?? [], error: opts.postsUpdateError ?? null });
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: opts.postReadData ?? null, error: opts.postReadError ?? null }),
          maybeSingle: async () => ({ data: opts.postRereadData ?? null, error: null }),
        }),
      }),
      update: () => ({ eq: () => ({ eq: () => ({ select: updateResult }) }) }),
    }),
    rpc: async (fn: string, args: any) => {
      rpcs.push({ fn, args });
      return { data: null, error: opts.rpcError ?? null };
    },
  } as unknown as SupabaseClient<any>;
  return { client, rpcs };
}

const REREAD_ROW = {
  post_id: 'p_1',
  owner_id: 'u_1',
  type: 'Give',
  status: 'closed_delivered',
  visibility: 'Public',
  title: 'title',
  description: null,
  category: 'Other',
  city: 'IL-001',
  street: null,
  street_number: null,
  location_display_level: 'CityOnly',
  item_condition: 'Good',
  urgency: null,
  reopen_count: 0,
  delete_after: null,
  created_at: '2026-05-16T10:00:00.000Z',
  updated_at: '2026-05-16T12:00:00.000Z',
};

describe('closePost — with recipient (atomic RPC path)', () => {
  it('calls close_post_with_recipient RPC and returns the re-read post', async () => {
    const { client, rpcs } = makeFakeClient({ postRereadData: REREAD_ROW });
    const out = await closePost(client, 'p_1', 'u_recipient');
    expect(rpcs).toEqual([
      { fn: 'close_post_with_recipient', args: { p_post_id: 'p_1', p_recipient_user_id: 'u_recipient' } },
    ]);
    expect(out.postId).toBe('p_1');
  });

  it('maps RPC errors through mapClosurePgError', async () => {
    const { client } = makeFakeClient({
      rpcError: { message: 'closure_not_owner' },
    });
    await expect(closePost(client, 'p_1', 'u_recipient')).rejects.toMatchObject({
      name: 'PostError',
      code: 'closure_not_owner',
    });
  });

  it('throws "disappeared after close" if the re-read returns no row', async () => {
    const { client } = makeFakeClient({ postRereadData: null });
    await expect(closePost(client, 'p_1', 'u_recipient')).rejects.toMatchObject({
      name: 'PostError',
      code: 'unknown',
    });
  });
});

describe('closePost — without recipient (direct UPDATE with race gate)', () => {
  it('updates status=deleted_no_recipient (status=open gate) and returns the re-read', async () => {
    const { client, rpcs } = makeFakeClient({
      postsUpdateData: [{ post_id: 'p_1' }],
      postRereadData: REREAD_ROW,
    });
    const out = await closePost(client, 'p_1', null);
    expect(rpcs).toHaveLength(0); // No RPC on this path
    expect(out.postId).toBe('p_1');
  });

  it('throws PostError("closure_wrong_status") when the status gate hits zero rows (race)', async () => {
    // Concurrent close_post_with_recipient already moved post → closed_delivered.
    const { client } = makeFakeClient({ postsUpdateData: [] });
    await expect(closePost(client, 'p_1', null)).rejects.toMatchObject({
      name: 'PostError',
      code: 'closure_wrong_status',
    });
  });

  it('maps direct-update errors through mapClosurePgError', async () => {
    const { client } = makeFakeClient({
      postsUpdateError: { message: 'closure_wrong_status' },
    });
    await expect(closePost(client, 'p_1', null)).rejects.toMatchObject({
      name: 'PostError',
      code: 'closure_wrong_status',
    });
  });
});

describe('reopenPost — branches by current status', () => {
  it('current=closed_delivered → reopen_post_marked RPC', async () => {
    const { client, rpcs } = makeFakeClient({
      postReadData: { status: 'closed_delivered', reopen_count: 0 },
      postRereadData: REREAD_ROW,
    });
    await reopenPost(client, 'p_1');
    expect(rpcs.map((r) => r.fn)).toEqual(['reopen_post_marked']);
    expect(rpcs[0]?.args).toEqual({ p_post_id: 'p_1' });
  });

  it('current=deleted_no_recipient → reopen_post_deleted_no_recipient RPC', async () => {
    const { client, rpcs } = makeFakeClient({
      postReadData: { status: 'deleted_no_recipient', reopen_count: 0 },
      postRereadData: REREAD_ROW,
    });
    await reopenPost(client, 'p_1');
    expect(rpcs.map((r) => r.fn)).toEqual(['reopen_post_deleted_no_recipient']);
  });

  it('current=open → throws PostError("closure_wrong_status") without firing any RPC', async () => {
    const { client, rpcs } = makeFakeClient({
      postReadData: { status: 'open', reopen_count: 0 },
    });
    await expect(reopenPost(client, 'p_1')).rejects.toMatchObject({
      name: 'PostError',
      code: 'closure_wrong_status',
    });
    expect(rpcs).toHaveLength(0);
  });

  it('initial status-read error is mapped through mapClosurePgError', async () => {
    const { client } = makeFakeClient({
      postReadError: { message: 'closure_not_owner' },
    });
    await expect(reopenPost(client, 'p_1')).rejects.toMatchObject({ name: 'PostError' });
  });

  it('reopen RPC error is mapped through mapClosurePgError', async () => {
    const { client } = makeFakeClient({
      postReadData: { status: 'closed_delivered', reopen_count: 0 },
      rpcError: { message: 'reopen_window_expired' },
    });
    await expect(reopenPost(client, 'p_1')).rejects.toMatchObject({
      name: 'PostError',
      code: 'reopen_window_expired',
    });
  });

  it('throws "disappeared after reopen" if the re-read returns no row', async () => {
    const { client } = makeFakeClient({
      postReadData: { status: 'closed_delivered', reopen_count: 0 },
      postRereadData: null,
    });
    await expect(reopenPost(client, 'p_1')).rejects.toBeInstanceOf(PostError);
  });
});
