import { describe, expect, it, vi } from 'vitest';

import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  createCommunityPost,
  normalizePostDraft,
  validatePostDraft,
} from '../use-cases/CreateCommunityPost';

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
    id: 'p-new',
    title: 'Hello',
    category: 'Knowledge',
    text: 'Body',
    tags: ['Education'],
    audience: 'Everyone',
    language: 'English',
    link: 'https://x.io',
    author_name: 'Dana',
    author_name_en: null,
    post_type: 'community',
    wish_type: null,
    impact_area: null,
    status: 'open',
    ...overrides,
  };
}

describe('validatePostDraft', () => {
  it('requires title and body/text', () => {
    expect(validatePostDraft({ title: 'T', text: 'Body' }).valid).toBe(true);
    expect(validatePostDraft({ title: 'T', body: 'Body' }).valid).toBe(true);
    expect(validatePostDraft({ title: '  ', text: 'Body' }).valid).toBe(false);
    expect(validatePostDraft({ title: 'T', text: '  ' }).valid).toBe(false);
    expect(validatePostDraft(null).valid).toBe(false);
  });

  it('returns a helpful error for the first missing field', () => {
    expect(validatePostDraft({}).error).toMatch(/title/i);
    expect(validatePostDraft({ title: 'T' }).error).toMatch(/share/i);
  });
});

describe('normalizePostDraft', () => {
  it('builds a community insert payload with array tags and trimmed fields', () => {
    expect(
      normalizePostDraft({
        title: '  Hello  ',
        category: ' Knowledge ',
        body: ' Body ',
        tags: 'Education, Climate',
        audience: ' Everyone ',
        language: ' English ',
        link: ' https://x.io ',
        authorName: ' Dana ',
      }),
    ).toEqual({
      post_type: 'community',
      title: 'Hello',
      category: 'Knowledge',
      text: 'Body',
      tags: ['Education', 'Climate'],
      audience: 'Everyone',
      language: 'English',
      link: 'https://x.io',
      author_name: 'Dana',
      author_name_en: null,
    });
  });

  it('collapses blank optional fields and prefers text over body', () => {
    expect(
      normalizePostDraft({ title: 'T', text: 'Real', body: 'Ignored' }),
    ).toMatchObject({
      post_type: 'community',
      title: 'T',
      text: 'Real',
      tags: [],
      category: '',
      audience: '',
      language: '',
      link: '',
      author_name: '',
      author_name_en: null,
    });
  });
});

describe('createCommunityPost', () => {
  it('validates, normalizes, and inserts a community post', async () => {
    const insert = vi.fn(async () => makeInsertedRow());
    const result = await createCommunityPost(
      { posts: makePosts(insert) },
      {
        title: 'Hello',
        text: 'Body',
        category: 'Knowledge',
        tags: 'Education',
        authorName: 'Dana',
      },
    );

    expect(insert).toHaveBeenCalledWith({
      post_type: 'community',
      title: 'Hello',
      category: 'Knowledge',
      text: 'Body',
      tags: ['Education'],
      audience: '',
      language: '',
      link: '',
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
    const result = await createCommunityPost(
      { posts: makePosts(insert) },
      { title: '  ', text: 'Body' },
    );

    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Please add a post title.',
    });
  });

  it('returns an error when insert fails', async () => {
    const result = await createCommunityPost(
      { posts: makePosts(async () => null) },
      { title: 'T', text: 'Body' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not publish post.',
    });
  });
});
