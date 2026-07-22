import { describe, expect, it } from 'vitest';

import {
  countRepliesByThread,
  groupMemberCounts,
  groupThreadCounts,
  mapForumGroupRow,
  mapForumGroups,
  mapForumReplies,
  mapForumReplyRow,
  mapForumThreadRow,
  mapForumThreads,
  repliesForThread,
  threadsForGroup,
  withGroupStats,
  withThreadReplyCounts,
} from '../helpers/forumCatalog';

describe('mapForumGroupRow', () => {
  it('maps a catalog row to the render shape with defaults', () => {
    expect(
      mapForumGroupRow({
        id: 'education',
        title: 'Education & Knowledge',
        description: 'Learning spaces and youth programs.',
        tags: ['Education', 'Youth'],
        icon: 'book',
      }),
    ).toEqual({
      id: 'education',
      title: 'Education & Knowledge',
      description: 'Learning spaces and youth programs.',
      tags: ['Education', 'Youth'],
      icon: 'book',
      members: 0,
      posts: 0,
      threads: [],
    });
  });

  it('coerces missing fields and tolerates null input', () => {
    expect(mapForumGroupRow({ id: 42 as unknown as string }).id).toBe('42');
    expect(mapForumGroupRow(null).tags).toEqual([]);
  });
});

describe('mapForumGroups', () => {
  it('maps a list and drops rows without an id', () => {
    expect(
      mapForumGroups([
        { id: 'a', title: 'A', description: '', tags: [], icon: '' },
        { title: 'no id', description: '', tags: [], icon: '' },
      ]).map((group) => group.id),
    ).toEqual(['a']);
  });
});

describe('mapForumThreadRow', () => {
  it('maps a thread row to the render shape', () => {
    expect(
      mapForumThreadRow({
        id: 'thread-1',
        group_id: 'education',
        user_id: 'user-9',
        title: 'How to run a study circle?',
        body: 'Looking for a lightweight format.',
        created_at: '2026-07-04T05:00:00Z',
      }),
    ).toEqual({
      id: 'thread-1',
      groupId: 'education',
      authorId: 'user-9',
      title: 'How to run a study circle?',
      body: 'Looking for a lightweight format.',
      createdAt: '2026-07-04T05:00:00Z',
      replies: 0,
    });
  });
});

describe('mapForumThreads', () => {
  it('maps a list preserving order and drops id-less rows', () => {
    expect(
      mapForumThreads([
        { id: 'thread-a', group_id: 'health', title: 'A', body: '' },
        { group_id: 'health', title: 'no id', body: '' },
      ]).map((thread) => thread.id),
    ).toEqual(['thread-a']);
  });
});

describe('threadsForGroup', () => {
  it('filters threads by groupId preserving order', () => {
    const threads = [
      { id: '1', groupId: 'education', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
      { id: '2', groupId: 'health', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
      { id: '3', groupId: 'education', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
    ];

    expect(threadsForGroup(threads, 'education').map((thread) => thread.id)).toEqual(['1', '3']);
  });
});

describe('mapForumReplyRow', () => {
  it('maps a reply row to the render shape', () => {
    expect(
      mapForumReplyRow({
        id: 'reply-1',
        thread_id: 'thread-9',
        user_id: 'user-3',
        body: 'Great idea, count me in.',
        created_at: '2026-07-04T06:00:00Z',
      }),
    ).toEqual({
      id: 'reply-1',
      threadId: 'thread-9',
      authorId: 'user-3',
      body: 'Great idea, count me in.',
      createdAt: '2026-07-04T06:00:00Z',
    });
  });
});

describe('repliesForThread', () => {
  it('filters replies by threadId preserving order', () => {
    const replies = [
      { id: '1', threadId: 't1', authorId: '', body: '', createdAt: '' },
      { id: '2', threadId: 't2', authorId: '', body: '', createdAt: '' },
      { id: '3', threadId: 't1', authorId: '', body: '', createdAt: '' },
    ];

    expect(repliesForThread(replies, 't1').map((reply) => reply.id)).toEqual(['1', '3']);
  });
});

describe('countRepliesByThread', () => {
  it('counts replies per thread id', () => {
    const replies = [
      { id: '1', threadId: 't1', authorId: '', body: '', createdAt: '' },
      { id: '2', threadId: 't1', authorId: '', body: '', createdAt: '' },
      { id: '3', threadId: 't2', authorId: '', body: '', createdAt: '' },
    ];

    expect(countRepliesByThread(replies)).toEqual({ t1: 2, t2: 1 });
  });
});

describe('groupThreadCounts', () => {
  it('counts threads per group id', () => {
    const threads = [
      { id: '1', groupId: 'education', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
      { id: '2', groupId: 'education', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
      { id: '3', groupId: 'health', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
    ];

    expect(groupThreadCounts(threads)).toEqual({ education: 2, health: 1 });
  });
});

describe('groupMemberCounts', () => {
  it('counts distinct authors of threads and replies per group', () => {
    const threads = [
      { id: 't1', groupId: 'education', authorId: 'u1', title: '', body: '', createdAt: '', replies: 0 },
      { id: 't2', groupId: 'education', authorId: 'u2', title: '', body: '', createdAt: '', replies: 0 },
      { id: 't3', groupId: 'health', authorId: 'u3', title: '', body: '', createdAt: '', replies: 0 },
    ];
    const replies = [
      { id: 'r1', threadId: 't1', authorId: 'u2', body: '', createdAt: '' },
      { id: 'r2', threadId: 't1', authorId: 'u4', body: '', createdAt: '' },
    ];

    expect(groupMemberCounts(threads, replies)).toEqual({ education: 3, health: 1 });
  });
});

describe('withGroupStats', () => {
  it('overlays live member and post counts onto mapped groups', () => {
    const groups = [
      mapForumGroupRow({ id: 'education', title: 'Education', description: '', tags: [], icon: '' }),
    ];
    const threads = [
      { id: 't1', groupId: 'education', authorId: 'u1', title: '', body: '', createdAt: '', replies: 0 },
      { id: 't2', groupId: 'education', authorId: 'u2', title: '', body: '', createdAt: '', replies: 0 },
    ];
    const replies = [
      { id: 'r1', threadId: 't1', authorId: 'u3', body: '', createdAt: '' },
    ];

    expect(withGroupStats(groups, threads, replies)).toEqual([
      expect.objectContaining({ id: 'education', posts: 2, members: 3 }),
    ]);
  });
});

describe('withThreadReplyCounts', () => {
  it('overlays live reply counts onto mapped threads', () => {
    const threads = [
      { id: 't1', groupId: 'education', authorId: '', title: '', body: '', createdAt: '', replies: 0 },
    ];
    const replies = [
      { id: 'r1', threadId: 't1', authorId: '', body: '', createdAt: '' },
      { id: 'r2', threadId: 't1', authorId: '', body: '', createdAt: '' },
    ];

    expect(withThreadReplyCounts(threads, replies)).toEqual([
      expect.objectContaining({ id: 't1', replies: 2 }),
    ]);
  });
});
