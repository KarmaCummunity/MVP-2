import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertPostActorIdentityRow } from '../postActorIdentityMethods';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('upsertPostActorIdentityRow', () => {
  it('calls upsert_post_actor_identity RPC with mapped args (0160 / TD-85)', async () => {
    const rpcCalls: Array<{ name: string; params: unknown }> = [];
    const client = {
      rpc: (name: string, params: unknown) => {
        rpcCalls.push({ name, params });
        return Promise.resolve({ data: null, error: null });
      },
    } as unknown as SupabaseClient<any>;

    await upsertPostActorIdentityRow(client, {
      postId: 'p_1',
      userId: 'u_1',
      surfaceVisibility: 'OnlyMe',
      hideFromCounterparty: true,
    });

    expect(rpcCalls).toEqual([
      {
        name: 'upsert_post_actor_identity',
        params: {
          p_post_id: 'p_1',
          p_surface_visibility: 'OnlyMe',
          p_hide_from_counterparty: true,
        },
      },
    ]);
  });

  it('throws when RPC returns an error', async () => {
    const client = {
      rpc: () =>
        Promise.resolve({ data: null, error: { message: 'forbidden_not_participant' } }),
    } as unknown as SupabaseClient<any>;

    await expect(
      upsertPostActorIdentityRow(client, {
        postId: 'p_1',
        userId: 'u_1',
        surfaceVisibility: 'OnlyMe',
        hideFromCounterparty: true,
      }),
    ).rejects.toThrow('upsertPostActorIdentity: forbidden_not_participant');
  });
});
