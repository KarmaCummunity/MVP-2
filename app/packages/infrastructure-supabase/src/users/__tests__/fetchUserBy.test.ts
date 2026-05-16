import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchUserBy } from '../fetchUserBy';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface QueryCall {
  table: string;
  selected: string;
  eqCol: string;
  eqVal: unknown;
}

function makeFakeClient(opts: {
  data?: unknown;
  error?: { message: string } | null;
  viewerId?: string | null;
}): { client: SupabaseClient<any>; calls: QueryCall[] } {
  const calls: QueryCall[] = [];
  const client = {
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, val: unknown) => ({
          maybeSingle: async () => {
            calls.push({ table, selected: cols, eqCol: col, eqVal: val });
            return { data: opts.data ?? null, error: opts.error ?? null };
          },
        }),
      }),
    }),
    auth: {
      getSession: async () => ({
        data: {
          session:
            opts.viewerId !== undefined && opts.viewerId !== null
              ? { user: { id: opts.viewerId } }
              : null,
        },
      }),
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

const FAKE_USER_ROW = {
  user_id: 'u_target',
  auth_provider: 'google',
  share_handle: 'target',
  display_name: 'Target',
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
  items_given_count: 3,
  items_received_count: 2,
  active_posts_count_internal: 7,
  followers_count: 10,
  following_count: 5,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-05-16T00:00:00.000Z',
};

describe('fetchUserBy', () => {
  describe('query shape', () => {
    it('queries users table selecting * with eq(user_id, value).maybeSingle', async () => {
      const { client, calls } = makeFakeClient({ data: null });

      await fetchUserBy(client, 'user_id', 'u_target');

      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({
        table: 'users',
        selected: '*',
        eqCol: 'user_id',
        eqVal: 'u_target',
      });
    });

    it('queries by share_handle when that column variant is requested', async () => {
      const { client, calls } = makeFakeClient({ data: null });

      await fetchUserBy(client, 'share_handle', 'target');

      expect(calls[0]?.eqCol).toBe('share_handle');
      expect(calls[0]?.eqVal).toBe('target');
    });
  });

  describe('result shape', () => {
    it('returns null when data is null (no matching row)', async () => {
      const { client } = makeFakeClient({ data: null, viewerId: 'u_target' });

      const out = await fetchUserBy(client, 'user_id', 'u_target');

      expect(out).toBeNull();
    });

    it('returns the fully-mapped user when the viewer IS the row owner (counters intact)', async () => {
      const { client } = makeFakeClient({
        data: FAKE_USER_ROW,
        viewerId: 'u_target',
      });

      const out = await fetchUserBy(client, 'user_id', 'u_target');

      expect(out).not.toBeNull();
      expect(out!.userId).toBe('u_target');
      expect(out!.activePostsCountInternal).toBe(7);
      expect(out!.itemsGivenCount).toBe(3);
      expect(out!.itemsReceivedCount).toBe(2);
    });
  });

  describe('TD-39 — activePostsCountInternal scrub for non-self viewers', () => {
    it('scrubs activePostsCountInternal to 0 when the viewer is a different signed-in user', async () => {
      // Non-owner must not be able to infer OnlyMe post existence via
      // (active_posts_count_internal − visible_count). The trigger-grant
      // returns the raw value; the adapter zeros it.
      const { client } = makeFakeClient({
        data: FAKE_USER_ROW,
        viewerId: 'u_someone_else',
      });

      const out = await fetchUserBy(client, 'user_id', 'u_target');

      expect(out!.activePostsCountInternal).toBe(0);
    });

    it('scrubs activePostsCountInternal to 0 when the viewer is anonymous (no session)', async () => {
      const { client } = makeFakeClient({
        data: FAKE_USER_ROW,
        viewerId: null,
      });

      const out = await fetchUserBy(client, 'user_id', 'u_target');

      expect(out!.activePostsCountInternal).toBe(0);
    });

    it('leaves closure-side counters intact for non-self viewers (lifetime totals are not privacy-sensitive)', async () => {
      const { client } = makeFakeClient({
        data: FAKE_USER_ROW,
        viewerId: 'u_someone_else',
      });

      const out = await fetchUserBy(client, 'user_id', 'u_target');

      // itemsGivenCount / itemsReceivedCount are computed over closed_delivered
      // posts only — they don't leak OnlyMe presence.
      expect(out!.itemsGivenCount).toBe(3);
      expect(out!.itemsReceivedCount).toBe(2);
      // Followers / following counts are also intact.
      expect(out!.followersCount).toBe(10);
      expect(out!.followingCount).toBe(5);
    });
  });

  describe('error path', () => {
    it('throws with a prefixed "fetchUserBy(<column>): " message on query failure', async () => {
      const { client } = makeFakeClient({
        error: { message: 'transport error' },
      });

      await expect(fetchUserBy(client, 'user_id', 'u_target')).rejects.toThrow(
        'fetchUserBy(user_id): transport error',
      );
    });

    it('includes the share_handle variant in the prefix when querying by that column', async () => {
      const { client } = makeFakeClient({
        error: { message: 'rls violated' },
      });

      await expect(fetchUserBy(client, 'share_handle', 'target')).rejects.toThrow(
        'fetchUserBy(share_handle): rls violated',
      );
    });
  });
});
