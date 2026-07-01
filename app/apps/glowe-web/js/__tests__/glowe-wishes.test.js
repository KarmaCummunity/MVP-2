import { describe, it, expect } from 'vitest';
import GloweWishes from '../glowe-wishes.js';

function wishRow(overrides = {}) {
    return {
        id: 'post-1', post_type: 'wish', status: 'open', title: 'Need volunteers',
        text: 'Help us run a workshop', wish_type: 'Volunteers Needed', impact_area: 'Education',
        author_name: 'Org A', user_id: 'u1', created_at: '2026-07-01T09:00:00Z', ...overrides
    };
}

describe('isOpenWish', () => {
    it('is true only for open wish posts', () => {
        expect(GloweWishes.isOpenWish(wishRow())).toBe(true);
        expect(GloweWishes.isOpenWish(wishRow({ status: 'fulfilled' }))).toBe(false);
        expect(GloweWishes.isOpenWish(wishRow({ post_type: 'community' }))).toBe(false);
        expect(GloweWishes.isOpenWish(null)).toBe(false);
    });

    it('reads camelCase fields too', () => {
        expect(GloweWishes.isOpenWish({ postType: 'wish', status: 'open' })).toBe(true);
    });
});

describe('mapWishRow', () => {
    it('maps a row to the board view model', () => {
        const w = GloweWishes.mapWishRow(wishRow());
        expect(w).toMatchObject({
            id: 'post-1', type: 'Volunteers Needed', title: 'Need volunteers',
            description: 'Help us run a workshop', author: 'Org A', authorId: 'u1', areas: ['Education']
        });
        expect(w.time).toBeTruthy();
    });

    it('falls back for missing fields', () => {
        const w = GloweWishes.mapWishRow({ id: 'post-2', post_type: 'wish', status: 'open', title: 'X' });
        expect(w.type).toBe('Open Call');
        expect(w.author).toBe('GloWe Member');
        expect(w.areas).toEqual([]);
    });
});

describe('filterWishes', () => {
    const list = [
        GloweWishes.mapWishRow(wishRow({ id: 'a', wish_type: 'Volunteers Needed', impact_area: 'Education' })),
        GloweWishes.mapWishRow(wishRow({ id: 'b', wish_type: 'Funding Support', impact_area: 'Health' })),
        GloweWishes.mapWishRow(wishRow({ id: 'c', wish_type: 'Volunteers Needed', impact_area: 'Environment' }))
    ];

    it('returns all when filters are "all"', () => {
        expect(GloweWishes.filterWishes(list, { type: 'all', area: 'all' })).toHaveLength(3);
    });

    it('filters by wish type', () => {
        const ids = GloweWishes.filterWishes(list, { type: 'Volunteers Needed' }).map(w => w.id);
        expect(ids).toEqual(['a', 'c']);
    });

    it('filters by impact area', () => {
        const ids = GloweWishes.filterWishes(list, { area: 'Health' }).map(w => w.id);
        expect(ids).toEqual(['b']);
    });
});

describe('wishStats', () => {
    it('counts open wishes and distinct impact areas', () => {
        const list = [
            GloweWishes.mapWishRow(wishRow({ id: 'a', impact_area: 'Education' })),
            GloweWishes.mapWishRow(wishRow({ id: 'b', impact_area: 'Education' })),
            GloweWishes.mapWishRow(wishRow({ id: 'c', impact_area: 'Health' }))
        ];
        expect(GloweWishes.wishStats(list)).toEqual({ openWishes: 3, impactAreas: 2 });
        expect(GloweWishes.wishStats([])).toEqual({ openWishes: 0, impactAreas: 0 });
    });
});
