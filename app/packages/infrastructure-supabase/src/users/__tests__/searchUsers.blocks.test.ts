import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { searchUsers } from '../searchUsers';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion to searchUsers.test.ts — covers the blocks-filtering branch
// in its own file so each test file stays under the 200-LOC arch cap.

interface UsersCall {
  table: 'users';
}
interface BlocksCall {
  table: 'blocks';
  selected: string;
  eqCol: string;
  eqVal: unknown;
}
type AnyCall = UsersCall | BlocksCall;

function makeFakeClient(opts: {
  usersData?: unknown;
  usersError?: { message: string } | null;
  blocksData?: unknown;
  blocksError?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: AnyCall[] } {
  const calls: AnyCall[] = [];
  const client = {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            or: () => ({
              neq: () => ({
                limit: async () => {
                  calls.push({ table: 'users' });
                  return { data: opts.usersData ?? null, error: opts.usersError ?? null };
                },
              }),
            }),
          }),
        };
      }
      if (table === 'blocks') {
        return {
          select: (cols: string) => ({
            eq: async (eqCol: string, eqVal: unknown) => {
              calls.push({ table: 'blocks', selected: cols, eqCol, eqVal });
              return { data: opts.blocksData ?? null, error: opts.blocksError ?? null };
            },
          }),
        };
      }
      throw new Error(`fake: unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

const FAKE_USER_ROW = {
  user_id: 'u_1',
  auth_provider: 'google',
  share_handle: 'alice',
  display_name: 'Alice',
  city: 'IL-001',
  city_name: 'Tel Aviv',
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

describe('searchUsers — blocks filtering', () => {
  it('drops rows whose user_id is in the blocker -> blocked set', async () => {
    const { client } = makeFakeClient({
      usersData: [
        FAKE_USER_ROW,
        { ...FAKE_USER_ROW, user_id: 'u_blocked', share_handle: 'blocked' },
        { ...FAKE_USER_ROW, user_id: 'u_2', share_handle: 'two' },
      ],
      blocksData: [{ blocked_id: 'u_blocked' }],
    });

    const out = await searchUsers(client, 'ali', { excludeUserId: 'u_me', limit: 10 });

    expect(out.map((u) => u.userId)).toEqual(['u_1', 'u_2']);
  });

  it('queries the blocks table for the caller as the blocker', async () => {
    const { client, calls } = makeFakeClient({ usersData: [], blocksData: [] });

    await searchUsers(client, 'ali', { excludeUserId: 'u_me', limit: 10 });

    const blocksCall = calls.find((c) => c.table === 'blocks') as BlocksCall;
    expect(blocksCall).toBeDefined();
    expect(blocksCall.eqCol).toBe('blocker_id');
    expect(blocksCall.eqVal).toBe('u_me');
    expect(blocksCall.selected).toBe('blocked_id');
  });

  it('returns all users (no filtering) when the blocks query errors — defensive fail-open', async () => {
    // Block listing failure must not surface to the caller; the search
    // continues with no block filtering rather than throw.
    const { client } = makeFakeClient({
      usersData: [FAKE_USER_ROW],
      blocksData: null,
      blocksError: { message: 'rls denied' },
    });

    const out = await searchUsers(client, 'ali', { excludeUserId: 'u_me', limit: 10 });

    expect(out).toHaveLength(1);
    expect(out[0]?.userId).toBe('u_1');
  });
});
