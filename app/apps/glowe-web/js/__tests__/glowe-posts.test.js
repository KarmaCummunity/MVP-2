import { describe, it, expect } from 'vitest';
import GlowePosts from '../glowe-posts.js';

describe('isCommunityPost', () => {
    it('accepts community rows and legacy rows without a post_type', () => {
        expect(GlowePosts.isCommunityPost({ post_type: 'community' })).toBe(true);
        expect(GlowePosts.isCommunityPost({})).toBe(true);
        expect(GlowePosts.isCommunityPost({ post_type: null })).toBe(true);
        expect(GlowePosts.isCommunityPost({ post_type: '' })).toBe(true);
    });

    it('rejects wishes and empty input', () => {
        expect(GlowePosts.isCommunityPost({ post_type: 'wish' })).toBe(false);
        expect(GlowePosts.isCommunityPost(null)).toBe(false);
    });
});

describe('mapPostRow', () => {
    it('maps a server row to the feed shape with author attribution', () => {
        expect(GlowePosts.mapPostRow({
            id: 'p1', title: 'Hello', category: 'Knowledge', text: 'Body',
            tags: ['a', 'b'], user_id: 'u1', author_name: 'Dana', created_at: '2026-01-01'
        })).toEqual({
            id: 'p1', title: 'Hello', category: 'Knowledge', text: 'Body',
            tags: ['a', 'b'], authorId: 'u1', authorName: 'Dana', createdAt: '2026-01-01'
        });
    });

    it('applies friendly defaults for missing fields', () => {
        const mapped = GlowePosts.mapPostRow({ id: 'p2' });
        expect(mapped).toMatchObject({ title: '', category: '', text: '', tags: [], authorId: '', authorName: 'Community Member', createdAt: '' });
    });
});

describe('mapCommunityRows', () => {
    it('drops wishes and maps only community posts', () => {
        const rows = [
            { id: 'p1', post_type: 'community', title: 'A' },
            { id: 'w1', post_type: 'wish', title: 'W' },
            { id: 'p2', title: 'Legacy' }
        ];
        expect(GlowePosts.mapCommunityRows(rows).map(p => p.id)).toEqual(['p1', 'p2']);
    });

    it('handles empty and null input', () => {
        expect(GlowePosts.mapCommunityRows([])).toEqual([]);
        expect(GlowePosts.mapCommunityRows(null)).toEqual([]);
    });
});

describe('commaList', () => {
    it('splits comma strings, passes arrays, handles empty', () => {
        expect(GlowePosts.commaList('Education, Climate , Health')).toEqual(['Education', 'Climate', 'Health']);
        expect(GlowePosts.commaList([' a ', 'b'])).toEqual(['a', 'b']);
        expect(GlowePosts.commaList('')).toEqual([]);
        expect(GlowePosts.commaList(null)).toEqual([]);
    });
});

describe('validatePostDraft', () => {
    it('requires title and body/text', () => {
        expect(GlowePosts.validatePostDraft({ title: 'T', text: 'Body' }).valid).toBe(true);
        expect(GlowePosts.validatePostDraft({ title: 'T', body: 'Body' }).valid).toBe(true);
        expect(GlowePosts.validatePostDraft({ title: '  ', text: 'Body' }).valid).toBe(false);
        expect(GlowePosts.validatePostDraft({ title: 'T', text: '  ' }).valid).toBe(false);
        expect(GlowePosts.validatePostDraft(null).valid).toBe(false);
    });

    it('returns a helpful error for the first missing field', () => {
        expect(GlowePosts.validatePostDraft({}).error).toMatch(/title/i);
        expect(GlowePosts.validatePostDraft({ title: 'T' }).error).toMatch(/share/i);
    });
});

describe('isPostOwner', () => {
    it('matches the author and rejects strangers, guests, and blank ids', () => {
        expect(GlowePosts.isPostOwner({ authorId: 'u1' }, 'u1')).toBe(true);
        expect(GlowePosts.isPostOwner({ authorId: 'u1' }, 'u2')).toBe(false);
        expect(GlowePosts.isPostOwner({ authorId: 'u1' }, '')).toBe(false);
        expect(GlowePosts.isPostOwner({ authorId: 'u1' }, null)).toBe(false);
        expect(GlowePosts.isPostOwner({ authorId: 'u1' }, undefined)).toBe(false);
        expect(GlowePosts.isPostOwner(null, 'u1')).toBe(false);
    });

    it('compares ids as strings', () => {
        expect(GlowePosts.isPostOwner({ authorId: 7 }, '7')).toBe(true);
    });
});

describe('normalizePostDraft', () => {
    it('builds a community insert payload with array tags and trimmed fields', () => {
        expect(GlowePosts.normalizePostDraft({
            title: '  Hello  ', category: ' Knowledge ', body: ' Body ',
            tags: 'Education, Climate', audience: ' Everyone ', language: ' English ',
            link: ' https://x.io ', authorName: ' Dana '
        })).toEqual({
            post_type: 'community', title: 'Hello', category: 'Knowledge', text: 'Body',
            tags: ['Education', 'Climate'], audience: 'Everyone', language: 'English',
            link: 'https://x.io', author_name: 'Dana'
        });
    });

    it('collapses blank optional fields and prefers text over body', () => {
        const payload = GlowePosts.normalizePostDraft({ title: 'T', text: 'Real', body: 'Ignored' });
        expect(payload).toMatchObject({ post_type: 'community', title: 'T', text: 'Real', tags: [], category: '', audience: '', language: '', link: '', author_name: '' });
    });
});
