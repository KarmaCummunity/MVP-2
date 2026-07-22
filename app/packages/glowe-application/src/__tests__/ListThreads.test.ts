import { describe, expect, it, vi } from 'vitest';

import type { IGloweForumRepository } from '../ports/IGloweForumRepository';
import { listThreads as listThreadsUseCase } from '../use-cases/ListThreads';

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

describe('listThreads', () => {
  it('fetches threads and replies then returns threads with reply counts', async () => {
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
      {
        id: 'r2',
        thread_id: 't1',
        user_id: 'u3',
        body: 'Another',
        created_at: '2026-01-03',
      },
    ]);

    const threads = await listThreadsUseCase(
      { forums: makeForumRepo({ listThreads, listReplies }) },
      {},
    );

    expect(listThreads).toHaveBeenCalledOnce();
    expect(listReplies).toHaveBeenCalledWith({ orderBy: 'created_at', ascending: true });
    expect(threads).toEqual([
      expect.objectContaining({ id: 't1', groupId: 'education', replies: 2 }),
    ]);
  });

  it('filters threads by groupId when provided', async () => {
    const listThreads = vi.fn(async () => [
      {
        id: 't1',
        group_id: 'education',
        user_id: 'u1',
        title: 'A',
        body: '',
        created_at: '2026-01-01',
      },
      {
        id: 't2',
        group_id: 'health',
        user_id: 'u2',
        title: 'B',
        body: '',
        created_at: '2026-01-02',
      },
    ]);

    const threads = await listThreadsUseCase(
      { forums: makeForumRepo({ listThreads, listReplies: vi.fn(async () => []) }) },
      { groupId: 'education' },
    );

    expect(threads.map((thread) => thread.id)).toEqual(['t1']);
  });

  it('returns an empty list when the repository yields null rows', async () => {
    const threads = await listThreadsUseCase(
      {
        forums: makeForumRepo({
          listThreads: vi.fn(async () => null),
          listReplies: vi.fn(async () => null),
        }),
      },
      {},
    );

    expect(threads).toEqual([]);
  });

  it('forwards list order options to listThreads', async () => {
    const listThreads = vi.fn(async () => []);

    await listThreadsUseCase(
      { forums: makeForumRepo({ listThreads, listReplies: vi.fn(async () => []) }) },
      { order: { ascending: false, orderBy: 'created_at' } },
    );

    expect(listThreads).toHaveBeenCalledWith({ ascending: false, orderBy: 'created_at' });
  });
});
