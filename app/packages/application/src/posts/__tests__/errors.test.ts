import { describe, it, expect } from 'vitest';
import { PostError, isPostError } from '../errors';

describe('PostError', () => {
  it('is an Error subclass with name="PostError" and carries code/message/cause', () => {
    const cause = new Error('inner');
    const err = new PostError('title_required', 'Title is required', cause);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PostError);
    expect(err.name).toBe('PostError');
    expect(err.code).toBe('title_required');
    expect(err.message).toBe('Title is required');
    expect(err.cause).toBe(cause);
  });

  it('cause defaults to undefined', () => {
    expect(new PostError('forbidden', 'x').cause).toBeUndefined();
  });

  it('preserves a sample of every code category (validation / closure / moderation)', () => {
    for (const code of [
      'title_required', 'title_too_long', 'description_too_long', 'address_required',
      'image_required_for_give', 'condition_required_for_give', 'urgency_only_for_request',
      'visibility_downgrade_forbidden', 'invalid_post_type', 'forbidden',
      'closure_not_owner', 'closure_wrong_status', 'closure_recipient_not_in_chat',
      'reopen_window_expired', 'post_not_open', 'post_owner_delete_forbidden', 'unknown',
    ] as const) {
      expect(new PostError(code, code).code).toBe(code);
    }
  });
});

describe('isPostError', () => {
  it('returns true only for PostError instances', () => {
    expect(isPostError(new PostError('forbidden', ''))).toBe(true);
    expect(isPostError(new Error('plain'))).toBe(false);
    expect(isPostError({ code: 'forbidden', name: 'PostError' })).toBe(false);
    expect(isPostError(null)).toBe(false);
    expect(isPostError(undefined)).toBe(false);
    expect(isPostError('forbidden')).toBe(false);
  });
});
