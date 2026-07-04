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
