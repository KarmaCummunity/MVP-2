import { describe, expect, it, vi } from 'vitest';

import type {
  GloweForumReplyRow,
  IGloweForumRepository,
} from '../ports/IGloweForumRepository';
import {
  normalizeReplyDraft,
  replyToThread,
  validateReplyDraft,
} from '../use-cases/ReplyToThread';

function makeForumRepo(
  createReplyImpl: IGloweForumRepository['createReply'],
): IGloweForumRepository {
  return {
    listGroups: vi.fn(),
    listThreads: vi.fn(),
    listReplies: vi.fn(),
    createThread: vi.fn(),
    createReply: createReplyImpl,
  };
}

function makeReplyRow(overrides: Partial<GloweForumReplyRow> = {}): GloweForumReplyRow {
  return {
    id: 'reply-new',
    thread_id: 'thread-1',
    user_id: 'u1',
    body: 'Thanks!',
    created_at: '2026-01-01',
    ...overrides,
  };
}

describe('validateReplyDraft', () => {
  it('requires thread id and body', () => {
    expect(validateReplyDraft({ threadId: 't1', body: 'Reply' }).valid).toBe(true);
    expect(validateReplyDraft({ body: 'Reply' }).valid).toBe(false);
    expect(validateReplyDraft({ threadId: 't1' }).valid).toBe(false);
  });

  it('returns a helpful error for the first missing field', () => {
    expect(validateReplyDraft({}).error).toMatch(/thread/i);
    expect(validateReplyDraft({ threadId: 't1' }).error).toMatch(/reply/i);
  });
});

describe('normalizeReplyDraft', () => {
  it('builds a create payload with trimmed fields', () => {
    expect(
      normalizeReplyDraft({
        thread_id: ' thread-1 ',
        body: ' Thanks ',
      }),
    ).toEqual({
      thread_id: 'thread-1',
      body: 'Thanks',
    });
  });
});

describe('replyToThread', () => {
  it('validates, normalizes, and creates a reply', async () => {
    const createReply = vi.fn(async () => makeReplyRow());
    const result = await replyToThread(
      { forums: makeForumRepo(createReply) },
      { threadId: 'thread-1', body: 'Thanks!' },
    );

    expect(createReply).toHaveBeenCalledWith({
      thread_id: 'thread-1',
      body: 'Thanks!',
    });
    expect(result).toEqual({ ok: true, reply: makeReplyRow() });
  });

  it('returns a validation error without calling createReply', async () => {
    const createReply = vi.fn();
    const result = await replyToThread(
      { forums: makeForumRepo(createReply) },
      { threadId: 'thread-1', body: '  ' },
    );

    expect(createReply).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'Please write a reply.' });
  });

  it('returns an error when createReply fails', async () => {
    const result = await replyToThread(
      { forums: makeForumRepo(async () => null) },
      { threadId: 'thread-1', body: 'Thanks!' },
    );

    expect(result).toEqual({ ok: false, error: 'Could not post reply.' });
  });
});
