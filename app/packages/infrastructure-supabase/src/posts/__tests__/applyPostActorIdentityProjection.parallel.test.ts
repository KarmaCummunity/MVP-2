import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostWithOwner } from '@kc/application';
import { applyPostActorIdentityProjectionBatch } from '../applyPostActorIdentityProjection';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Records the table name on every `.from(table)` call and resolves each query
// on a later microtask, so we can assert that BOTH reads are dispatched in the
// same synchronous tick (parallel) rather than one after the other (waterfall).
function makeRecordingClient(records: string[]): SupabaseClient<any> {
  const from = (table: string) => {
    records.push(table);
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve().then(() => resolve({ data: [], error: null })),
    };
    return chain;
  };
  return { from } as unknown as SupabaseClient<any>;
}

function makePost(postId: string, ownerId: string): PostWithOwner {
  return {
    postId,
    ownerId,
    ownerName: 'Owner',
    ownerHandle: 'owner',
    ownerAvatarUrl: null,
    visibility: 'Public',
    createdAt: '2026-01-01T00:00:00.000Z',
    recipientUser: null,
    recipient: null,
  } as unknown as PostWithOwner;
}

describe('applyPostActorIdentityProjectionBatch — parallel reads', () => {
  it('dispatches the identity read and the follow-edges read in the same tick', async () => {
    const records: string[] = [];
    const client = makeRecordingClient(records);

    // Do not await yet: the synchronous portion runs up to the `await
    // Promise.all([...])`, which evaluates both fetches (and thus both
    // `from(...)` calls) before suspending.
    const pending = applyPostActorIdentityProjectionBatch(
      client,
      [makePost('p_1', 'u_owner')],
      'u_viewer',
    );

    expect(records).toContain('post_actor_identity');
    expect(records).toContain('follow_edges');

    await pending;
  });

  it('skips the follow-edges read entirely for an anonymous viewer', async () => {
    const records: string[] = [];
    const client = makeRecordingClient(records);

    await applyPostActorIdentityProjectionBatch(
      client,
      [makePost('p_1', 'u_owner')],
      null,
    );

    expect(records).toContain('post_actor_identity');
    expect(records).not.toContain('follow_edges');
  });

  it('returns posts unchanged in count and short-circuits on empty input', async () => {
    const records: string[] = [];
    const client = makeRecordingClient(records);

    const out = await applyPostActorIdentityProjectionBatch(client, [], 'u_viewer');

    expect(out).toEqual([]);
    expect(records).toEqual([]);
  });
});
