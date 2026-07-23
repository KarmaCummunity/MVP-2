import { describe, expect, it, vi } from 'vitest';

import type {
  GloweOfferRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';
import {
  normalizeOfferDraft,
  offerSupport,
} from '../use-cases/OfferSupport';
import { validateOfferDraft } from '@kc/glowe-domain';

function makePosts(
  insertOffer: IGlowePostRepository['insertOffer'],
): IGlowePostRepository {
  return {
    listAll: vi.fn(),
    listMine: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    listOffersForPost: vi.fn(),
    insertOffer,
  };
}

function makeInsertedOffer(
  overrides: Partial<GloweOfferRow> = {},
): GloweOfferRow {
  return {
    id: 'o-new',
    post_id: 'w1',
    offer_text: 'Offering: Mentoring\n\nAvailable evenings',
    availability: 'Weekends',
    contact_preference: 'In-app message',
    ...overrides,
  };
}

describe('validateOfferDraft', () => {
  it('requires offer_text and availability', () => {
    expect(
      validateOfferDraft({
        offer_text: 'I can mentor',
        availability: 'Weekends',
      }).valid,
    ).toBe(true);
    expect(
      validateOfferDraft({ offer_text: '  ', availability: 'Weekends' }).valid,
    ).toBe(false);
    expect(validateOfferDraft(null).valid).toBe(false);
  });
});

describe('normalizeOfferDraft', () => {
  it('builds an offer insert payload with composed offer text', () => {
    expect(
      normalizeOfferDraft('w1', {
        support_type: 'Mentoring',
        availability: 'Weekends',
        message: 'Available evenings',
        contact_preference: 'Email',
      }),
    ).toEqual({
      post_id: 'w1',
      offer_text: 'Offering: Mentoring\n\nAvailable evenings',
      availability: 'Weekends',
      contact_preference: 'Email',
    });
  });

  it('defaults contact preference to in-app message', () => {
    expect(
      normalizeOfferDraft('w1', {
        offer_text: 'I can help',
        availability: 'Weekdays',
      }),
    ).toMatchObject({
      post_id: 'w1',
      offer_text: 'I can help',
      availability: 'Weekdays',
      contact_preference: 'In-app message',
    });
  });
});

describe('offerSupport', () => {
  it('validates, normalizes, and inserts an offer', async () => {
    const insertOffer = vi.fn(async () => makeInsertedOffer());
    const result = await offerSupport(
      { posts: makePosts(insertOffer) },
      {
        postId: 'w1',
        draft: {
          support_type: 'Mentoring',
          availability: 'Weekends',
          message: 'Available evenings',
        },
      },
    );

    expect(insertOffer).toHaveBeenCalledWith({
      post_id: 'w1',
      offer_text: 'Offering: Mentoring\n\nAvailable evenings',
      availability: 'Weekends',
      contact_preference: 'In-app message',
    });
    expect(result).toEqual({
      ok: true,
      offer: makeInsertedOffer(),
    });
  });

  it('returns a validation error without calling insertOffer', async () => {
    const insertOffer = vi.fn();
    const result = await offerSupport(
      { posts: makePosts(insertOffer) },
      {
        postId: 'w1',
        draft: { offer_text: '  ', availability: 'Weekends' },
      },
    );

    expect(insertOffer).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Please describe what you can offer.',
    });
  });

  it('returns an error when insertOffer fails', async () => {
    const result = await offerSupport(
      { posts: makePosts(async () => null) },
      {
        postId: 'w1',
        draft: { offer_text: 'I can help', availability: 'Weekdays' },
      },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not send offer.',
    });
  });

  it('requires a post id', async () => {
    const insertOffer = vi.fn();
    const result = await offerSupport(
      { posts: makePosts(insertOffer) },
      {
        postId: '',
        draft: { offer_text: 'I can help', availability: 'Weekdays' },
      },
    );

    expect(insertOffer).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Missing wish to support.',
    });
  });
});
