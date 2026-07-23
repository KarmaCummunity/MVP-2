import { describe, expect, it, vi } from 'vitest';

import type {
  GloweForumThreadRow,
  IGloweForumRepository,
} from '../ports/IGloweForumRepository';
import {
  createThread,
  normalizeThreadDraft,
  validateThreadDraft,
} from '../use-cases/CreateThread';

function makeForumRepo(
  createThreadImpl: IGloweForumRepository['createThread'],
): IGloweForumRepository {
  return {
    listGroups: vi.fn(),
    listThreads: vi.fn(),
    listReplies: vi.fn(),
    createThread: createThreadImpl,
    createReply: vi.fn(),
  };
}

function makeThreadRow(overrides: Partial<GloweForumThreadRow> = {}): GloweForumThreadRow {
  return {
    id: 'thread-new',
    group_id: 'education',
    user_id: 'u1',
    title: 'Hello',
    body: 'Body',
    created_at: '2026-01-01',
    ...overrides,
  };
}

describe('validateThreadDraft', () => {
  it('requires group id, title, and body', () => {
    expect(
      validateThreadDraft({
        groupId: 'education',
        title: 'Title',
        body: 'Body',
      }).valid,
    ).toBe(true);
    expect(validateThreadDraft({ title: 'T', body: 'B' }).valid).toBe(false);
    expect(validateThreadDraft({ groupId: 'education', body: 'B' }).valid).toBe(false);
    expect(validateThreadDraft({ groupId: 'education', title: 'T' }).valid).toBe(false);
  });

  it('returns a helpful error for the first missing field', () => {
    expect(validateThreadDraft({}).error).toMatch(/group/i);
    expect(validateThreadDraft({ groupId: 'education' }).error).toMatch(/title/i);
    expect(validateThreadDraft({ groupId: 'education', title: 'T' }).error).toMatch(/question/i);
  });
});

describe('normalizeThreadDraft', () => {
  it('builds a create payload with trimmed fields', () => {
    expect(
      normalizeThreadDraft({
        group_id: ' education ',
        title: '  Hello  ',
        body: ' Body ',
      }),
    ).toEqual({
      group_id: 'education',
      title: 'Hello',
      body: 'Body',
    });
  });
});

describe('createThread', () => {
  it('validates, normalizes, and creates a thread', async () => {
    const createThreadFn = vi.fn(async () => makeThreadRow());
    const result = await createThread(
      { forums: makeForumRepo(createThreadFn) },
      { groupId: 'education', title: 'Hello', body: 'Body' },
    );

    expect(createThreadFn).toHaveBeenCalledWith({
      group_id: 'education',
      title: 'Hello',
      body: 'Body',
    });
    expect(result).toEqual({ ok: true, thread: makeThreadRow() });
  });

  it('returns a validation error without calling createThread', async () => {
    const createThreadFn = vi.fn();
    const result = await createThread(
      { forums: makeForumRepo(createThreadFn) },
      { groupId: 'education', title: '  ', body: 'Body' },
    );

    expect(createThreadFn).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'Please add a thread title.' });
  });

  it('returns an error when createThread fails', async () => {
    const result = await createThread(
      { forums: makeForumRepo(async () => null) },
      { groupId: 'education', title: 'T', body: 'Body' },
    );

    expect(result).toEqual({ ok: false, error: 'Could not create thread.' });
  });
});
