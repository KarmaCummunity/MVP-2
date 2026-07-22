import { describe, expect, it, vi } from 'vitest';

import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  isCommunityPost,
  listCommunityPosts,
  mapCommunityRows,
  mapPostRow,
} from '../use-cases/ListCommunityPosts';

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

describe('isCommunityPost', () => {
  it('accepts community rows and legacy rows without a post_type', () => {
    expect(isCommunityPost({ post_type: 'community' })).toBe(true);
    expect(isCommunityPost({})).toBe(true);
    expect(isCommunityPost({ post_type: undefined })).toBe(true);
    expect(isCommunityPost({ post_type: '' })).toBe(true);
  });

  it('rejects wishes, removed rows, and empty input', () => {
    expect(isCommunityPost({ post_type: 'wish' })).toBe(false);
    expect(isCommunityPost({ status: 'removed' })).toBe(false);
    expect(isCommunityPost(null)).toBe(false);
  });
});

describe('mapPostRow', () => {
  it('maps a server row to the feed shape with author attribution', () => {
    expect(
      mapPostRow({
        id: 'p1',
        title: 'Hello',
        category: 'Knowledge',
        text: 'Body',
        tags: ['a', 'b'],
        user_id: 'u1',
        author_name: 'Dana',
        created_at: '2026-01-01',
      } as unknown as GlowePostRow),
    ).toEqual({
      id: 'p1',
      title: 'Hello',
      category: 'Knowledge',
      text: 'Body',
      tags: ['a', 'b'],
      authorId: 'u1',
      authorName: 'Dana',
      authorNameEn: '',
      createdAt: '2026-01-01',
    });
  });

  it('applies friendly defaults for missing fields', () => {
    expect(mapPostRow({ id: 'p2' } as GlowePostRow)).toMatchObject({
      title: '',
      category: '',
      text: '',
      tags: [],
      authorId: '',
      authorName: 'Community Member',
      createdAt: '',
    });
  });
});

describe('mapCommunityRows', () => {
  it('drops wishes and maps only community posts', () => {
    const rows = [
      { id: 'p1', post_type: 'community', title: 'A' },
      { id: 'w1', post_type: 'wish', title: 'W' },
      { id: 'p2', title: 'Legacy' },
    ] as GlowePostRow[];

    expect(mapCommunityRows(rows).map((post) => post.id)).toEqual(['p1', 'p2']);
  });

  it('handles empty and null input', () => {
    expect(mapCommunityRows([])).toEqual([]);
    expect(mapCommunityRows(null)).toEqual([]);
  });
});

describe('listCommunityPosts', () => {
  it('fetches rows from the repository and returns mapped community posts', async () => {
    const listAll = vi.fn(async () => [
      {
        id: 'p1',
        post_type: 'community',
        title: 'Hello',
        category: '',
        text: 'Body',
        tags: [],
        audience: '',
        language: '',
        link: '',
        author_name: 'Dana',
        author_name_en: null,
        wish_type: null,
        impact_area: null,
        status: 'open',
        user_id: 'u1',
        created_at: '2026-01-01',
      },
      {
        id: 'w1',
        post_type: 'wish',
        title: 'Wish',
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
        status: 'open',
      },
    ]);

    const posts = await listCommunityPosts(
      { posts: makePosts(listAll) },
      {},
    );

    expect(listAll).toHaveBeenCalledOnce();
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      id: 'p1',
      title: 'Hello',
      authorId: 'u1',
      authorName: 'Dana',
    });
  });

  it('returns an empty list when the repository yields null', async () => {
    const posts = await listCommunityPosts(
      { posts: makePosts(async () => null) },
      {},
    );

    expect(posts).toEqual([]);
  });

  it('forwards list order options to the repository', async () => {
    const listAll = vi.fn(async () => []);

    await listCommunityPosts(
      { posts: makePosts(listAll) },
      { order: { ascending: false, orderBy: 'created_at' } },
    );

    expect(listAll).toHaveBeenCalledWith({ ascending: false, orderBy: 'created_at' });
  });
});
