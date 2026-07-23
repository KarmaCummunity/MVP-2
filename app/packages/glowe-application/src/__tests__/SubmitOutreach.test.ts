import { describe, expect, it, vi } from 'vitest';

import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  buildOutreachPayload,
  submitOutreach,
  validateOutreachDraft,
} from '../use-cases/SubmitOutreach';

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

function makeInsertedPost(
  overrides: Partial<GlowePostRow> = {},
): GlowePostRow {
  return {
    id: 'outreach-1',
    title: 'Reach-out to Open Heart',
    category: 'outreach',
    text: 'We would love to collaborate.',
    tags: [],
    audience: 'org-1',
    language: '',
    link: '',
    author_name: '',
    author_name_en: null,
    post_type: 'outreach',
    wish_type: null,
    impact_area: null,
    status: 'sent',
    ...overrides,
  };
}

describe('validateOutreachDraft', () => {
  it('accepts a draft with a recipient and a message', () => {
    expect(
      validateOutreachDraft({ recipientId: 'u1', message: 'Hello there' }),
    ).toEqual({ valid: true, error: '' });
  });

  it('rejects a draft without a recipient', () => {
    expect(validateOutreachDraft({ message: 'Hello' })).toEqual({
      valid: false,
      error: 'Missing recipient.',
    });
  });

  it('rejects an empty or whitespace-only message', () => {
    expect(validateOutreachDraft({ recipientId: 'u1', message: '   ' })).toEqual({
      valid: false,
      error: 'Please write a short message.',
    });
    expect(validateOutreachDraft({ recipientId: 'u1' })).toEqual({
      valid: false,
      error: 'Please write a short message.',
    });
  });

  it('is safe with no input', () => {
    expect(validateOutreachDraft(undefined)).toEqual({
      valid: false,
      error: 'Missing recipient.',
    });
  });
});

describe('buildOutreachPayload', () => {
  it('builds a glowe_posts outreach row with the recipient in audience', () => {
    expect(
      buildOutreachPayload({
        recipientId: 'org-1',
        orgName: 'Open Heart',
        message: '  We would love to collaborate.  ',
      }),
    ).toEqual({
      post_type: 'outreach',
      category: 'outreach',
      title: 'Reach-out to Open Heart',
      text: 'We would love to collaborate.',
      audience: 'org-1',
      status: 'sent',
      tags: [],
    });
  });

  it('falls back to a generic title when orgName is missing', () => {
    expect(
      buildOutreachPayload({ recipientId: 'org-2', message: 'Hi' }).title,
    ).toBe('Reach-out');
  });

  it('is safe with no input', () => {
    const payload = buildOutreachPayload(undefined);
    expect(payload.post_type).toBe('outreach');
    expect(payload.audience).toBe('');
  });
});

describe('submitOutreach', () => {
  it('validates, normalizes, and inserts an outreach post', async () => {
    const insert = vi.fn(async () => makeInsertedPost());
    const result = await submitOutreach(
      { posts: makePosts(insert) },
      {
        recipientId: 'org-1',
        orgName: 'Open Heart',
        message: 'We would love to collaborate.',
      },
    );

    expect(insert).toHaveBeenCalledWith({
      post_type: 'outreach',
      category: 'outreach',
      title: 'Reach-out to Open Heart',
      text: 'We would love to collaborate.',
      audience: 'org-1',
      status: 'sent',
      tags: [],
    });
    expect(result).toEqual({
      ok: true,
      post: makeInsertedPost(),
    });
  });

  it('returns a validation error without calling insert', async () => {
    const insert = vi.fn();
    const result = await submitOutreach(
      { posts: makePosts(insert) },
      { recipientId: 'org-1', message: '   ' },
    );

    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Please write a short message.',
    });
  });

  it('returns an error when insert fails', async () => {
    const result = await submitOutreach(
      { posts: makePosts(async () => null) },
      { recipientId: 'org-1', message: 'Hello there' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not send outreach.',
    });
  });
});
