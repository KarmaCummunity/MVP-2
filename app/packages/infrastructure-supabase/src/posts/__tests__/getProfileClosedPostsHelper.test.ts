import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getProfileClosedPostsHelper } from '../getProfileClosedPostsHelper';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  rpcData?: unknown;
  rpcError?: { message: string } | null;
  postsData?: unknown;
  postsError?: { message: string } | null;
}
interface Calls {
  rpcs: { fn: string; args: any }[];
  inOps: { col: string; vals: unknown[] }[];
}

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; calls: Calls } {
  const calls: Calls = { rpcs: [], inOps: [] };
  const client = {
    rpc: async (fn: string, args: any) => {
      calls.rpcs.push({ fn, args });
      return { data: opts.rpcData ?? null, error: opts.rpcError ?? null };
    },
    from: () => ({
      select: () => ({
        in: async (col: string, vals: unknown[]) => {
          calls.inOps.push({ col, vals });
          return { data: opts.postsData ?? null, error: opts.postsError ?? null };
        },
      }),
    }),
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

// Minimal PostJoinedRow fields the mapper reads. Mirrors the pattern from
// mapPostRow.test.ts but inlined here so the test stays self-contained.
function postRow(id: string) {
  return {
    post_id: id,
    owner_id: 'u_owner',
    type: 'Give',
    status: 'closed_delivered',
    visibility: 'Public',
    title: id,
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
}

describe('getProfileClosedPostsHelper — RPC call', () => {
  it('clamps limit > 100 down to HARD_MAX_LIMIT', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 9999);
    expect(calls.rpcs[0]?.args.p_limit).toBe(100);
  });

  it('clamps limit < 1 up to 1', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 0);
    expect(calls.rpcs[0]?.args.p_limit).toBe(1);
  });

  it('forwards profile/viewer/cursor (null default) to the RPC', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25);
    expect(calls.rpcs[0]).toEqual({
      fn: 'profile_closed_posts',
      args: {
        p_profile_user_id: 'u_profile',
        p_viewer_user_id: 'u_viewer',
        p_limit: 25,
        p_cursor: null,
      },
    });
  });

  it('forwards an explicit cursor verbatim', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    await getProfileClosedPostsHelper(client, 'u_profile', null, 25, 'cursor_xyz');
    expect(calls.rpcs[0]?.args.p_cursor).toBe('cursor_xyz');
  });

  it('forwards null viewerId verbatim (anon viewer)', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    await getProfileClosedPostsHelper(client, 'u_profile', null, 10);
    expect(calls.rpcs[0]?.args.p_viewer_user_id).toBeNull();
  });

  it('throws with prefixed "getProfileClosedPosts: " message on RPC error', async () => {
    const { client } = makeFakeClient({ rpcError: { message: 'rls denied' } });
    await expect(
      getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 10),
    ).rejects.toThrow('getProfileClosedPosts: rls denied');
  });

  it('short-circuits to [] when the RPC returns zero rows (no hydrate call)', async () => {
    const { client, calls } = makeFakeClient({ rpcData: [] });
    const out = await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25);
    expect(out).toEqual([]);
    expect(calls.inOps).toHaveLength(0);
  });
});

describe('getProfileClosedPostsHelper — hydrate + reassemble', () => {
  it('hydrates the post IDs returned by the RPC via select.in', async () => {
    const { client, calls } = makeFakeClient({
      rpcData: [
        { post_id: 'p_1', identity_role: 'publisher', closed_at: '2026-05-16T12:00:00.000Z' },
        { post_id: 'p_2', identity_role: 'respondent', closed_at: '2026-05-16T11:00:00.000Z' },
      ],
      postsData: [postRow('p_1'), postRow('p_2')],
    });
    await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25);
    expect(calls.inOps[0]).toEqual({ col: 'post_id', vals: ['p_1', 'p_2'] });
  });

  it('preserves RPC-returned order, attaching identityRole + closedAt verbatim', async () => {
    const { client } = makeFakeClient({
      rpcData: [
        { post_id: 'p_2', identity_role: 'respondent', closed_at: '2026-05-16T11:00:00.000Z' },
        { post_id: 'p_1', identity_role: 'publisher', closed_at: '2026-05-16T12:00:00.000Z' },
      ],
      // Return rows in REVERSE of RPC order to prove the re-sort kicks in.
      postsData: [postRow('p_1'), postRow('p_2')],
    });
    const out = await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25);
    expect(out.map((i) => i.post.postId)).toEqual(['p_2', 'p_1']);
    expect(out[0]?.identityRole).toBe('respondent');
    expect(out[1]?.identityRole).toBe('publisher');
    expect(out[0]?.closedAt).toBe('2026-05-16T11:00:00.000Z');
  });

  it('silently drops posts that the RPC returned but RLS hides from the hydrate fetch', async () => {
    // Models the edge case where a post is visible at the RPC level but
    // RLS drops it during the IN-fetch (e.g., RLS predicate desync).
    const { client } = makeFakeClient({
      rpcData: [
        { post_id: 'p_1', identity_role: 'publisher', closed_at: '2026-05-16T12:00:00.000Z' },
        { post_id: 'p_missing', identity_role: 'publisher', closed_at: '2026-05-16T11:00:00.000Z' },
        { post_id: 'p_3', identity_role: 'respondent', closed_at: '2026-05-16T10:00:00.000Z' },
      ],
      postsData: [postRow('p_1'), postRow('p_3')],
    });
    const out = await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25);
    expect(out.map((i) => i.post.postId)).toEqual(['p_1', 'p_3']);
  });

  it('returns [] when the hydrate fetch returns null data', async () => {
    const { client } = makeFakeClient({
      rpcData: [{ post_id: 'p_1', identity_role: 'publisher', closed_at: 'x' }],
      postsData: null,
    });
    expect(await getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25)).toEqual([]);
  });

  it('throws with prefixed "getProfileClosedPosts hydrate: " message on hydrate error', async () => {
    const { client } = makeFakeClient({
      rpcData: [{ post_id: 'p_1', identity_role: 'publisher', closed_at: 'x' }],
      postsError: { message: 'rls denied' },
    });
    await expect(
      getProfileClosedPostsHelper(client, 'u_profile', 'u_viewer', 25),
    ).rejects.toThrow('getProfileClosedPosts hydrate: rls denied');
  });
});
