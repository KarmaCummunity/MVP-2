import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePostInput } from '@kc/application';
import { SupabasePostRepository } from '../SupabasePostRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Step {
  data?: unknown;
  error?: { message: string; code?: string } | null;
}
interface Op {
  kind: string;
  table?: string;
  args?: unknown[];
}

// Sequential step model: each terminal await consumes the NEXT step from the
// queue. Lets us script multi-from() flows (posts insert → media insert →
// orphan-cleanup delete → fetchPostById select).
function makeFakeClient(steps: Step[]): { client: SupabaseClient<any>; ops: Op[] } {
  const ops: Op[] = [];
  let stepIdx = 0;
  let currentTable: string | undefined;
  const consume = () => {
    const s = steps[stepIdx++] ?? {};
    return { data: s.data ?? null, error: s.error ?? null };
  };
  function makeChain(table: string): any {
    return new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(consume()).then(onFulfilled, onRejected);
        }
        return (...args: any[]) => {
          ops.push({ kind: prop, table, args });
          return makeChain(table);
        };
      },
    });
  }
  const client = {
    from: (table: string) => {
      currentTable = table;
      ops.push({ kind: 'from', table, args: [table] });
      return makeChain(table);
    },
  } as unknown as SupabaseClient<any>;
  // Silence unused-warning on currentTable (used implicitly through ops).
  void currentTable;
  return { client, ops };
}

const VALID_INPUT: CreatePostInput = {
  ownerId: 'u_me',
  type: 'Give',
  visibility: 'Public',
  title: 'Free Sofa',
  description: 'Good condition',
  category: 'Other',
  address: { city: 'IL-001', cityName: 'Tel Aviv', street: 'Main', streetNumber: '12' },
  locationDisplayLevel: 'CityOnly',
  itemCondition: 'Good',
  urgency: null,
  mediaAssets: [],
};

const FETCH_ROW = {
  post_id: 'p_new', owner_id: 'u_me', type: 'Give', status: 'open', visibility: 'Public',
  title: 'Free Sofa', description: 'Good condition', category: 'Other', city: 'IL-001',
  street: 'Main', street_number: '12', location_display_level: 'CityOnly',
  item_condition: 'Good', urgency: null, reopen_count: 0, delete_after: null,
  created_at: '2026-05-16T12:00:00.000Z', updated_at: '2026-05-16T12:00:00.000Z',
};

describe('SupabasePostRepository.create — happy paths', () => {
  it('inserts a post, skips media when mediaAssets=[], then re-fetches the row via fetchPostById', async () => {
    const { client, ops } = makeFakeClient([
      { data: { post_id: 'p_new' } }, // posts insert
      { data: FETCH_ROW },             // fetchPostById
    ]);
    const repo = new SupabasePostRepository(client);
    const out = await repo.create({ ...VALID_INPUT, mediaAssets: [] });
    expect(out.postId).toBe('p_new');

    // Should have hit `from('posts')` twice (insert + fetch), never `media_assets`.
    const fromTables = ops.filter((o) => o.kind === 'from').map((o) => o.table);
    expect(fromTables).toEqual(['posts', 'posts']);
  });

  it('inserts a post + then inserts media_assets with ordinal 0..n and field mapping (path, mime_type, size_bytes)', async () => {
    const { client, ops } = makeFakeClient([
      { data: { post_id: 'p_new' } }, // posts insert
      { error: null },                 // media_assets insert
      { data: FETCH_ROW },             // fetchPostById
    ]);
    const repo = new SupabasePostRepository(client);
    await repo.create({
      ...VALID_INPUT,
      mediaAssets: [
        { path: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 100 },
        { path: 'b.jpg', mimeType: 'image/jpeg', sizeBytes: 200 },
      ],
    });

    const mediaInsert = ops.find((o) => o.kind === 'insert' && o.table === 'media_assets');
    expect(mediaInsert?.args?.[0]).toEqual([
      { post_id: 'p_new', ordinal: 0, path: 'a.jpg', mime_type: 'image/jpeg', size_bytes: 100 },
      { post_id: 'p_new', ordinal: 1, path: 'b.jpg', mime_type: 'image/jpeg', size_bytes: 200 },
    ]);
  });

  it('upserts post_actor_identity when hideFromCounterparty is true (FR-POST-021)', async () => {
    const { client, ops } = makeFakeClient([
      { data: { post_id: 'p_new' } },
      { data: FETCH_ROW },
      { error: null },
    ]);
    const repo = new SupabasePostRepository(client);
    await repo.create({ ...VALID_INPUT, mediaAssets: [], hideFromCounterparty: true });

    const upsertOp = ops.find((o) => o.kind === 'upsert' && o.table === 'post_actor_identity');
    expect(upsertOp).toBeDefined();
    expect(upsertOp?.args?.[0]).toMatchObject({
      post_id: 'p_new',
      user_id: 'u_me',
      surface_visibility: 'Public',
      identity_visibility: 'Public',
      hide_from_counterparty: true,
    });
  });

  it('inserts the posts row with the address fields flattened (city/street/street_number)', async () => {
    const { client, ops } = makeFakeClient([
      { data: { post_id: 'p_new' } },
      { data: FETCH_ROW },
    ]);
    const repo = new SupabasePostRepository(client);
    await repo.create(VALID_INPUT);
    const insertOp = ops.find((o) => o.kind === 'insert' && o.table === 'posts');
    const payload = insertOp?.args?.[0] as Record<string, unknown>;
    expect(payload.city).toBe('IL-001');
    expect(payload.street).toBe('Main');
    expect(payload.street_number).toBe('12');
    expect(payload.owner_id).toBe('u_me');
    expect(payload.type).toBe('Give');
  });
});

describe('SupabasePostRepository.create — error paths', () => {
  it('routes posts-insert errors through mapInsertError (PostError surface, not raw Error)', async () => {
    // 23502 = NOT NULL violation on title → mapInsertError → PostError('title_required').
    const { client } = makeFakeClient([
      { error: { message: 'null value in column "title"', code: '23502' } },
    ]);
    const repo = new SupabasePostRepository(client);
    await expect(repo.create(VALID_INPUT)).rejects.toMatchObject({ name: 'PostError' });
  });

  it('throws "create.post: no row returned" when insert succeeds with null data (defensive)', async () => {
    const { client } = makeFakeClient([
      { data: null }, // PostgREST returned no row — shouldn't happen but defended.
    ]);
    const repo = new SupabasePostRepository(client);
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('create.post: no row returned');
  });

  it('on media-insert error: issues best-effort DELETE on posts and throws "create.media: <msg>"', async () => {
    const { client, ops } = makeFakeClient([
      { data: { post_id: 'p_new' } },              // posts insert succeeds
      { error: { message: 'storage path invalid' } }, // media insert fails
      { data: [{ post_id: 'p_new' }] },             // orphan-cleanup delete (ignored result)
    ]);
    const repo = new SupabasePostRepository(client);
    await expect(
      repo.create({ ...VALID_INPUT, mediaAssets: [{ path: 'x.jpg', mimeType: 'image/jpeg', sizeBytes: 1 }] }),
    ).rejects.toThrow('create.media: storage path invalid');

    // Verify the orphan cleanup actually fired: delete() on posts with eq('post_id', 'p_new').
    const deleteOp = ops.find((o) => o.kind === 'delete' && o.table === 'posts');
    expect(deleteOp).toBeDefined();
    const eqAfterDelete = ops.find(
      (o, i) => o.kind === 'eq' && o.table === 'posts' && i > ops.indexOf(deleteOp!),
    );
    expect(eqAfterDelete?.args).toEqual(['post_id', 'p_new']);
  });

  it('throws "create: post <id> disappeared after insert" when fetchPostById returns null after success', async () => {
    const { client } = makeFakeClient([
      { data: { post_id: 'p_new' } },
      { data: null }, // fetchPostById finds nothing — race against external delete/RLS flip
    ]);
    const repo = new SupabasePostRepository(client);
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('create: post p_new disappeared after insert');
  });
});
