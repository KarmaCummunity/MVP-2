import { describe, expect, it, vi } from 'vitest';

import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  createWish,
  normalizeWishDraft,
} from '../use-cases/CreateWish';
import { validateWishDraft } from '@kc/glowe-domain';

function makePosts(
  insert: IGlowePostRepository['insert'],
): IGlowePostRepository {
  return {
    listAll: vi.fn(),
    listMine: vi.fn(),
    insert,
    update: vi.fn(),
    remove: vi.fn(),
    listOffersForPost: vi.fn(),
    insertOffer: vi.fn(),
  };
}

function makeInsertedRow(overrides: Partial<GlowePostRow> = {}): GlowePostRow {
  return {
    id: 'w-new',
    title: 'Need mentors',
    category: '',
    text: 'Details here',
    tags: [],
    audience: '',
    language: '',
    link: '',
    author_name: 'Dana',
    author_name_en: null,
    post_type: 'wish',
    wish_type: 'Volunteers Needed',
    impact_area: 'Education',
    status: 'open',
    ...overrides,
  };
}

describe('validateWishDraft', () => {
  it('requires title, wish_type, and impact_area', () => {
    expect(
      validateWishDraft({
        title: 'T',
        wish_type: 'Funding Support',
        impact_area: 'Health',
      }).valid,
    ).toBe(true);
    expect(validateWishDraft({ title: '  ', wish_type: 'X', impact_area: 'Y' }).valid).toBe(false);
    expect(validateWishDraft(null).valid).toBe(false);
  });
});

describe('normalizeWishDraft', () => {
  it('builds a wish insert payload with composed body text', () => {
    expect(
      normalizeWishDraft({
        title: '  Need mentors  ',
        wish_type: 'Volunteers Needed',
        impact_area: ' Education ',
        details: 'Looking for 3 mentors',
        success: '3 mentors matched',
        location: 'Haifa',
        authorName: ' Dana ',
      }),
    ).toEqual({
      post_type: 'wish',
      status: 'open',
      title: 'Need mentors',
      wish_type: 'Volunteers Needed',
      impact_area: 'Education',
      text: 'Looking for 3 mentors\n\nSuccess looks like: 3 mentors matched\n\nLocation: Haifa',
      author_name: 'Dana',
      author_name_en: null,
    });
  });

  it('collapses blank optional fields', () => {
    expect(
      normalizeWishDraft({
        title: 'T',
        wish_type: 'X',
        impact_area: 'Y',
      }),
    ).toMatchObject({
      post_type: 'wish',
      status: 'open',
      title: 'T',
      text: '',
      author_name: '',
      author_name_en: null,
    });
  });
});

describe('createWish', () => {
  it('validates, normalizes, and inserts a wish post', async () => {
    const insert = vi.fn(async () => makeInsertedRow());
    const result = await createWish(
      { posts: makePosts(insert) },
      {
        title: 'Need mentors',
        wish_type: 'Volunteers Needed',
        impact_area: 'Education',
        details: 'Details here',
        authorName: 'Dana',
      },
    );

    expect(insert).toHaveBeenCalledWith({
      post_type: 'wish',
      status: 'open',
      title: 'Need mentors',
      wish_type: 'Volunteers Needed',
      impact_area: 'Education',
      text: 'Details here',
      author_name: 'Dana',
      author_name_en: null,
    });
    expect(result).toEqual({
      ok: true,
      post: makeInsertedRow(),
    });
  });

  it('returns a validation error without calling insert', async () => {
    const insert = vi.fn();
    const result = await createWish(
      { posts: makePosts(insert) },
      { title: '  ', wish_type: 'X', impact_area: 'Y' },
    );

    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Please describe what you need.',
    });
  });

  it('returns an error when insert fails', async () => {
    const result = await createWish(
      { posts: makePosts(async () => null) },
      {
        title: 'T',
        wish_type: 'X',
        impact_area: 'Y',
      },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not publish wish.',
    });
  });
});
