import { describe, expect, it, vi } from 'vitest';

import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  listWishes,
  mapOpenWishRows,
} from '../use-cases/ListWishes';

function makePosts(
  listAll: IGlowePostRepository['listAll'],
): IGlowePostRepository {
  return {
    listAll,
    listMine: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    listOffersForPost: vi.fn(),
    insertOffer: vi.fn(),
  };
}

function wishRow(overrides: Partial<GlowePostRow> = {}): GlowePostRow {
  return {
    id: 'w1',
    post_type: 'wish',
    status: 'open',
    title: 'Need volunteers',
    category: '',
    text: 'Help us run a workshop',
    tags: [],
    audience: '',
    language: '',
    link: '',
    author_name: 'Org A',
    author_name_en: null,
    wish_type: 'Volunteers Needed',
    impact_area: 'Education',
    user_id: 'u1',
    created_at: '2026-07-01T09:00:00Z',
    ...overrides,
  };
}

describe('mapOpenWishRows', () => {
  it('maps only open wish posts', () => {
    const rows = [
      wishRow({ id: 'w1' }),
      wishRow({ id: 'w2', status: 'fulfilled' }),
      {
        id: 'p1',
        post_type: 'community',
        status: 'open',
        title: 'Post',
        category: '',
        text: '',
        tags: [],
        audience: '',
        language: '',
        link: '',
        author_name: '',
        author_name_en: null,
        wish_type: null,
        impact_area: null,
      },
    ];

    const mapped = mapOpenWishRows(rows);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      id: 'w1',
      type: 'Volunteers Needed',
      title: 'Need volunteers',
      authorId: 'u1',
      areas: ['Education'],
    });
  });

  it('handles empty and null input', () => {
    expect(mapOpenWishRows([])).toEqual([]);
    expect(mapOpenWishRows(null)).toEqual([]);
  });
});

describe('listWishes', () => {
  it('fetches rows from the repository and returns mapped open wishes', async () => {
    const listAll = vi.fn(async () => [
      wishRow({ id: 'w1' }),
      wishRow({ id: 'w2', status: 'fulfilled' }),
      wishRow({ id: 'p1', post_type: 'community' }),
    ]);

    const wishes = await listWishes({ posts: makePosts(listAll) }, {});

    expect(listAll).toHaveBeenCalledOnce();
    expect(wishes).toHaveLength(1);
    expect(wishes[0]).toMatchObject({
      id: 'w1',
      title: 'Need volunteers',
      author: 'Org A',
    });
  });

  it('returns an empty list when the repository yields null', async () => {
    const wishes = await listWishes(
      { posts: makePosts(async () => null) },
      {},
    );

    expect(wishes).toEqual([]);
  });

  it('forwards list order options to the repository', async () => {
    const listAll = vi.fn(async () => []);

    await listWishes(
      { posts: makePosts(listAll) },
      { order: { ascending: false, orderBy: 'created_at' } },
    );

    expect(listAll).toHaveBeenCalledWith({ ascending: false, orderBy: 'created_at' });
  });

  it('applies client-side filters when provided', async () => {
    const listAll = vi.fn(async () => [
      wishRow({ id: 'a', wish_type: 'Volunteers Needed', impact_area: 'Education' }),
      wishRow({ id: 'b', wish_type: 'Funding Support', impact_area: 'Health' }),
    ]);

    const wishes = await listWishes(
      { posts: makePosts(listAll) },
      { filters: { type: 'Funding Support' } },
    );

    expect(wishes.map((wish) => wish.id)).toEqual(['b']);
  });
});
