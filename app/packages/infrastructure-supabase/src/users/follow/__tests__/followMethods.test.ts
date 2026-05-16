import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FollowError } from '@kc/application';
import {
  followEdge,
  isFollowingEdge,
  listFollowers,
  listFollowing,
  unfollowEdge,
} from '../followMethods';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  data?: unknown;
  error?: { code?: string; message?: string; details?: string } | null;
}
interface Op {
  kind: string;
  args?: unknown[];
}

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; ops: Op[] } {
  const ops: Op[] = [];
  // Chain proxy — every chain method returns the same proxy (chainable),
  // and the proxy is itself thenable so `await chain` resolves to
  // { data, error }. Terminators (single / maybeSingle) return a Promise
  // directly.
  function makeChain(): any {
    const result = () => ({ data: opts.data ?? null, error: opts.error ?? null });
    return new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(result()).then(onFulfilled, onRejected);
        }
        return (...args: any[]) => {
          ops.push({ kind: prop, args });
          if (prop === 'single' || prop === 'maybeSingle') return Promise.resolve(result());
          return makeChain();
        };
      },
    });
  }
  const client = {
    from: (table: string) => {
      ops.push({ kind: 'from', args: [table] });
      return makeChain();
    },
  } as unknown as SupabaseClient<any>;
  return { client, ops };
}

const FAKE_USER_ROW = {
  user_id: 'u_1',
  auth_provider: 'google',
  share_handle: 'a',
  display_name: 'A',
  city: 'IL-001',
  city_name: 'TLV',
  profile_street: null,
  profile_street_number: null,
  biography: null,
  avatar_url: null,
  privacy_mode: 'Public',
  privacy_changed_at: null,
  account_status: 'active',
  onboarding_state: 'completed',
  notification_preferences: {},
  is_super_admin: false,
  closure_explainer_dismissed: false,
  first_post_nudge_dismissed: false,
  items_given_count: 0,
  items_received_count: 0,
  active_posts_count_internal: 0,
  followers_count: 0,
  following_count: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-05-16T00:00:00.000Z',
};

describe('followEdge', () => {
  it('inserts (follower_id, followed_id) and maps the returned row to FollowEdge', async () => {
    const { client } = makeFakeClient({
      data: { follower_id: 'u_me', followed_id: 'u_them', created_at: '2026-05-16T12:00:00.000Z' },
    });
    expect(await followEdge(client, 'u_me', 'u_them')).toEqual({
      followerId: 'u_me',
      followedId: 'u_them',
      createdAt: '2026-05-16T12:00:00.000Z',
    });
  });

  it('maps insert errors through mapFollowError', async () => {
    const { client } = makeFakeClient({ error: { message: 'self_follow_forbidden' } });
    await expect(followEdge(client, 'u_me', 'u_me')).rejects.toBeInstanceOf(FollowError);
  });
});

describe('unfollowEdge', () => {
  it('issues a delete on follow_edges scoped by both ids', async () => {
    const { client, ops } = makeFakeClient({});
    await unfollowEdge(client, 'u_me', 'u_them');
    expect(ops.find((o) => o.kind === 'from')?.args?.[0]).toBe('follow_edges');
    expect(ops.find((o) => o.kind === 'delete')).toBeTruthy();
  });

  it('maps delete errors through mapFollowError', async () => {
    const { client } = makeFakeClient({ error: { code: '42501', message: 'rls denied' } });
    await expect(unfollowEdge(client, 'u_me', 'u_them')).rejects.toBeInstanceOf(FollowError);
  });
});

describe('isFollowingEdge', () => {
  it('returns true when a row is found', async () => {
    const { client } = makeFakeClient({ data: { follower_id: 'u_me' } });
    expect(await isFollowingEdge(client, 'u_me', 'u_them')).toBe(true);
  });

  it('returns false when no row is found (data null)', async () => {
    const { client } = makeFakeClient({ data: null });
    expect(await isFollowingEdge(client, 'u_me', 'u_them')).toBe(false);
  });

  it('throws via mapFollowError on query failure', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport' } });
    await expect(isFollowingEdge(client, 'u_me', 'u_them')).rejects.toBeInstanceOf(FollowError);
  });
});

describe('listFollowers / listFollowing — pagination + mapping', () => {
  it('listFollowers maps joined { follower } rows to User[]', async () => {
    const { client } = makeFakeClient({
      data: [{ follower: FAKE_USER_ROW }, { follower: null }, { follower: { ...FAKE_USER_ROW, user_id: 'u_2' } }],
    });
    const out = await listFollowers(client, 'u_target', 50);
    expect(out.map((u) => u.userId)).toEqual(['u_1', 'u_2']);
  });

  it('listFollowers returns [] when data is null', async () => {
    const { client } = makeFakeClient({ data: null });
    expect(await listFollowers(client, 'u_target', 50)).toEqual([]);
  });

  it('listFollowing maps joined { followed } rows to User[]', async () => {
    const { client } = makeFakeClient({
      data: [{ followed: FAKE_USER_ROW }, { followed: null }],
    });
    const out = await listFollowing(client, 'u_target', 50);
    expect(out.map((u) => u.userId)).toEqual(['u_1']);
  });

  it('cursor path uses lt() — the cursor branch is taken when cursor is provided', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await listFollowers(client, 'u_target', 25, 'u_cursor');
    expect(ops.find((o) => o.kind === 'lt')).toBeTruthy();
  });

  it('no-cursor path does NOT call lt()', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await listFollowers(client, 'u_target', 25);
    expect(ops.find((o) => o.kind === 'lt')).toBeFalsy();
  });

  it('listFollowers throws via mapFollowError on query failure', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport' } });
    await expect(listFollowers(client, 'u_target', 50)).rejects.toBeInstanceOf(FollowError);
  });
});
