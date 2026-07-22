import { describe, expect, it, vi } from 'vitest';

import type { IGloweForumRepository } from '../ports/IGloweForumRepository';
import { listForumGroups } from '../use-cases/ListForumGroups';

function makeForumRepo(
  overrides: Partial<IGloweForumRepository>,
): IGloweForumRepository {
  return {
    listGroups: vi.fn(async () => []),
    listThreads: vi.fn(async () => []),
    listReplies: vi.fn(async () => []),
    createThread: vi.fn(),
    createReply: vi.fn(),
    ...overrides,
  };
}

describe('listForumGroups', () => {
  it('fetches groups, threads, and replies then returns groups with live stats', async () => {
    const listGroups = vi.fn(async () => [
      {
        id: 'education',
        title: 'Education',
        description: 'Learning',
        tags: ['Education'],
        icon: 'book',
      },
    ]);
    const listThreads = vi.fn(async () => [
      {
        id: 't1',
        group_id: 'education',
        user_id: 'u1',
        title: 'Thread',
        body: 'Body',
        created_at: '2026-01-01',
      },
    ]);
    const listReplies = vi.fn(async () => [
      {
        id: 'r1',
        thread_id: 't1',
        user_id: 'u2',
        body: 'Reply',
        created_at: '2026-01-02',
      },
    ]);

    const groups = await listForumGroups(
      { forums: makeForumRepo({ listGroups, listThreads, listReplies }) },
      {},
    );

    expect(listGroups).toHaveBeenCalledWith({ orderBy: 'created_at', ascending: true });
    expect(listThreads).toHaveBeenCalledOnce();
    expect(listReplies).toHaveBeenCalledWith({ orderBy: 'created_at', ascending: true });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      id: 'education',
      title: 'Education',
      posts: 1,
      members: 2,
    });
  });

  it('returns an empty list when the repository yields null rows', async () => {
    const groups = await listForumGroups(
      {
        forums: makeForumRepo({
          listGroups: vi.fn(async () => null),
          listThreads: vi.fn(async () => null),
          listReplies: vi.fn(async () => null),
        }),
      },
      {},
    );

    expect(groups).toEqual([]);
  });

  it('forwards custom list order options to listGroups', async () => {
    const listGroups = vi.fn(async () => []);

    await listForumGroups(
      { forums: makeForumRepo({ listGroups }) },
      { order: { ascending: false, orderBy: 'title' } },
    );

    expect(listGroups).toHaveBeenCalledWith({ ascending: false, orderBy: 'title' });
  });
});
