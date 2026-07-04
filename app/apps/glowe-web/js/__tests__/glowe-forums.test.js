import { describe, it, expect } from 'vitest';
import GloweForums from '../glowe-forums.js';

describe('mapForumGroupRow', () => {
    it('maps a catalog row to the render shape with defaults', () => {
        const g = GloweForums.mapForumGroupRow({
            id: 'education',
            title: 'Education & Knowledge',
            description: 'Learning spaces and youth programs.',
            tags: ['Education', 'Youth'],
            icon: 'book'
        });
        expect(g).toEqual({
            id: 'education',
            title: 'Education & Knowledge',
            description: 'Learning spaces and youth programs.',
            tags: ['Education', 'Youth'],
            icon: 'book',
            members: 0,
            posts: 0,
            threads: []
        });
    });

    it('coerces missing/invalid fields to safe defaults', () => {
        const g = GloweForums.mapForumGroupRow({ id: 42 });
        expect(g.id).toBe('42');
        expect(g.title).toBe('');
        expect(g.description).toBe('');
        expect(g.tags).toEqual([]);
        expect(g.icon).toBe('');
        expect(g.threads).toEqual([]);
    });

    it('tolerates null / undefined input', () => {
        expect(GloweForums.mapForumGroupRow(null).id).toBe('');
        expect(GloweForums.mapForumGroupRow(undefined).tags).toEqual([]);
    });
});

describe('mapForumGroups', () => {
    it('maps a list and preserves order', () => {
        const rows = [
            { id: 'a', title: 'A', tags: [] },
            { id: 'b', title: 'B', tags: [] }
        ];
        const groups = GloweForums.mapForumGroups(rows);
        expect(groups.map(g => g.id)).toEqual(['a', 'b']);
        expect(groups.map(g => g.title)).toEqual(['A', 'B']);
    });

    it('drops rows without an id and tolerates non-arrays', () => {
        expect(GloweForums.mapForumGroups([{ title: 'no id' }, { id: 'ok' }]).map(g => g.id)).toEqual(['ok']);
        expect(GloweForums.mapForumGroups(null)).toEqual([]);
        expect(GloweForums.mapForumGroups(undefined)).toEqual([]);
    });
});
