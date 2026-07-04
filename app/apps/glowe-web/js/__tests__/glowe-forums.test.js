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

describe('mapForumThreadRow', () => {
    it('maps a thread row to the render shape', () => {
        const t = GloweForums.mapForumThreadRow({
            id: 'thread-1',
            group_id: 'education',
            user_id: 'user-9',
            title: 'How to run a study circle?',
            body: 'Looking for a lightweight format.',
            created_at: '2026-07-04T05:00:00Z'
        });
        expect(t).toEqual({
            id: 'thread-1',
            groupId: 'education',
            authorId: 'user-9',
            title: 'How to run a study circle?',
            body: 'Looking for a lightweight format.',
            createdAt: '2026-07-04T05:00:00Z',
            replies: 0
        });
    });

    it('coerces missing fields to safe defaults', () => {
        const t = GloweForums.mapForumThreadRow({ id: 7 });
        expect(t.id).toBe('7');
        expect(t.groupId).toBe('');
        expect(t.authorId).toBe('');
        expect(t.title).toBe('');
        expect(t.body).toBe('');
        expect(t.replies).toBe(0);
    });

    it('tolerates null / undefined input', () => {
        expect(GloweForums.mapForumThreadRow(null).id).toBe('');
        expect(GloweForums.mapForumThreadRow(undefined).groupId).toBe('');
    });
});

describe('mapForumThreads', () => {
    it('maps a list preserving order and drops id-less rows', () => {
        const rows = [
            { id: 'thread-a', group_id: 'health', title: 'A' },
            { group_id: 'health', title: 'no id' },
            { id: 'thread-b', group_id: 'rights', title: 'B' }
        ];
        expect(GloweForums.mapForumThreads(rows).map(t => t.id)).toEqual(['thread-a', 'thread-b']);
    });

    it('tolerates non-arrays', () => {
        expect(GloweForums.mapForumThreads(null)).toEqual([]);
        expect(GloweForums.mapForumThreads(undefined)).toEqual([]);
    });
});

describe('threadsForGroup', () => {
    it('filters threads by groupId preserving order', () => {
        const threads = [
            { id: '1', groupId: 'education' },
            { id: '2', groupId: 'health' },
            { id: '3', groupId: 'education' }
        ];
        expect(GloweForums.threadsForGroup(threads, 'education').map(t => t.id)).toEqual(['1', '3']);
    });

    it('returns empty for unknown group and tolerates non-arrays', () => {
        expect(GloweForums.threadsForGroup([{ id: '1', groupId: 'x' }], 'y')).toEqual([]);
        expect(GloweForums.threadsForGroup(null, 'education')).toEqual([]);
    });
});
