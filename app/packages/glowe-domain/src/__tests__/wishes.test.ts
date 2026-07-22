import { describe, it, expect } from 'vitest';
import {
  isOpenWish,
  mapWishRow,
  filterWishes,
  wishStats,
  validateWishDraft,
  buildWishText,
  isWishOwner,
  validateOfferDraft,
  buildOfferText,
} from '../wishes';

function wishRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    post_type: 'wish',
    status: 'open',
    title: 'Need volunteers',
    text: 'Help us run a workshop',
    wish_type: 'Volunteers Needed',
    impact_area: 'Education',
    author_name: 'Org A',
    user_id: 'u1',
    created_at: '2026-07-01T09:00:00Z',
    ...overrides,
  };
}

describe('isOpenWish', () => {
  it('is true only for open wish posts', () => {
    expect(isOpenWish(wishRow())).toBe(true);
    expect(isOpenWish(wishRow({ status: 'fulfilled' }))).toBe(false);
    expect(isOpenWish(wishRow({ post_type: 'community' }))).toBe(false);
    expect(isOpenWish(null)).toBe(false);
  });

  it('reads camelCase fields too', () => {
    expect(isOpenWish({ postType: 'wish', status: 'open' })).toBe(true);
  });
});

describe('mapWishRow', () => {
  it('maps a row to the board view model', () => {
    const w = mapWishRow(wishRow());
    expect(w).toMatchObject({
      id: 'post-1',
      type: 'Volunteers Needed',
      title: 'Need volunteers',
      description: 'Help us run a workshop',
      author: 'Org A',
      authorId: 'u1',
      areas: ['Education'],
    });
    expect(w.time).toBeTruthy();
  });

  it('falls back for missing fields', () => {
    const w = mapWishRow({
      id: 'post-2',
      post_type: 'wish',
      status: 'open',
      title: 'X',
    });
    expect(w.type).toBe('Open Call');
    expect(w.author).toBe('GloWe Member');
    expect(w.areas).toEqual([]);
  });
});

describe('filterWishes', () => {
  const list = [
    mapWishRow(
      wishRow({
        id: 'a',
        wish_type: 'Volunteers Needed',
        impact_area: 'Education',
      }),
    ),
    mapWishRow(
      wishRow({ id: 'b', wish_type: 'Funding Support', impact_area: 'Health' }),
    ),
    mapWishRow(
      wishRow({
        id: 'c',
        wish_type: 'Volunteers Needed',
        impact_area: 'Environment',
      }),
    ),
  ];

  it('returns all when filters are "all"', () => {
    expect(filterWishes(list, { type: 'all', area: 'all' })).toHaveLength(3);
  });

  it('filters by wish type', () => {
    const ids = filterWishes(list, { type: 'Volunteers Needed' }).map(
      (w) => w.id,
    );
    expect(ids).toEqual(['a', 'c']);
  });

  it('filters by impact area', () => {
    const ids = filterWishes(list, { area: 'Health' }).map((w) => w.id);
    expect(ids).toEqual(['b']);
  });
});

describe('wishStats', () => {
  it('counts open wishes and distinct impact areas', () => {
    const list = [
      mapWishRow(wishRow({ id: 'a', impact_area: 'Education' })),
      mapWishRow(wishRow({ id: 'b', impact_area: 'Education' })),
      mapWishRow(wishRow({ id: 'c', impact_area: 'Health' })),
    ];
    expect(wishStats(list)).toEqual({ openWishes: 3, impactAreas: 2 });
    expect(wishStats([])).toEqual({ openWishes: 0, impactAreas: 0 });
  });
});

describe('validateWishDraft', () => {
  it('requires title, wish_type, and impact_area', () => {
    expect(
      validateWishDraft({
        title: 'T',
        wish_type: 'Funding Support',
        impact_area: 'Health',
      }).valid,
    ).toBe(true);
    expect(
      validateWishDraft({ title: '  ', wish_type: 'X', impact_area: 'Y' })
        .valid,
    ).toBe(false);
    expect(
      validateWishDraft({ title: 'T', wish_type: '', impact_area: 'Y' }).valid,
    ).toBe(false);
    expect(
      validateWishDraft({ title: 'T', wish_type: 'X', impact_area: '' })
        .valid,
    ).toBe(false);
    expect(validateWishDraft(null).valid).toBe(false);
  });

  it('returns a helpful error message for the first missing field', () => {
    expect(validateWishDraft({}).error).toMatch(/describe what you need/i);
    expect(validateWishDraft({ title: 'T' }).error).toMatch(/wish type/i);
    expect(validateWishDraft({ title: 'T', wish_type: 'X' }).error).toMatch(
      /impact area/i,
    );
  });
});

describe('buildWishText', () => {
  it('folds details, success and location into a body', () => {
    const text = buildWishText({
      details: 'Need help',
      success: '3 mentors',
      location: 'Haifa',
    });
    expect(text).toContain('Need help');
    expect(text).toContain('Success looks like: 3 mentors');
    expect(text).toContain('Location: Haifa');
  });

  it('omits empty optional parts', () => {
    expect(buildWishText({ details: 'Only this' })).toBe('Only this');
    expect(buildWishText({})).toBe('');
  });
});

describe('isWishOwner', () => {
  it('is true only when the viewer published the wish', () => {
    const wish = mapWishRow(wishRow({ user_id: 'u1' }));
    expect(isWishOwner(wish, 'u1')).toBe(true);
    expect(isWishOwner(wish, 'u2')).toBe(false);
  });

  it('is false for guests or missing data', () => {
    const wish = mapWishRow(wishRow({ user_id: 'u1' }));
    expect(isWishOwner(wish, '')).toBe(false);
    expect(isWishOwner(wish, null)).toBe(false);
    expect(isWishOwner(null, 'u1')).toBe(false);
  });
});

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
    expect(
      validateOfferDraft({ offer_text: 'X', availability: '' }).valid,
    ).toBe(false);
    expect(validateOfferDraft(null).valid).toBe(false);
  });

  it('returns a helpful error for the first missing field', () => {
    expect(validateOfferDraft({}).error).toMatch(/what you can offer/i);
    expect(validateOfferDraft({ offer_text: 'X' }).error).toMatch(
      /availability/i,
    );
  });
});

describe('buildOfferText', () => {
  it('composes support type and message into a body', () => {
    const text = buildOfferText({
      support_type: 'Mentoring',
      message: 'Available evenings',
    });
    expect(text).toContain('Offering: Mentoring');
    expect(text).toContain('Available evenings');
  });

  it('omits empty optional parts', () => {
    expect(buildOfferText({ message: 'Only this' })).toBe('Only this');
    expect(buildOfferText({})).toBe('');
  });
});
