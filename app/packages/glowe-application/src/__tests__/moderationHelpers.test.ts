import { describe, expect, it } from 'vitest';

import {
  buildReportPayload,
  canonicalTargetType,
  isDuplicateReportError,
  validateReportDraft,
} from '../helpers/moderationHelpers';

describe('canonicalTargetType', () => {
  it('maps wish and offer cards to the post target', () => {
    expect(canonicalTargetType('wish')).toBe('post');
    expect(canonicalTargetType('offer')).toBe('post');
  });

  it('passes DB-native types through', () => {
    expect(canonicalTargetType('opportunity')).toBe('opportunity');
    expect(canonicalTargetType('profile')).toBe('profile');
  });

  it('falls back to general for unknown types', () => {
    expect(canonicalTargetType('banana')).toBe('general');
    expect(canonicalTargetType('')).toBe('general');
    expect(canonicalTargetType(undefined)).toBe('general');
  });
});

describe('validateReportDraft', () => {
  it('accepts a known reason and a target', () => {
    expect(validateReportDraft({ reason: 'spam', targetId: 'post-1' }).valid).toBe(true);
  });

  it('rejects an unknown or missing reason', () => {
    expect(validateReportDraft({ reason: 'rude' as 'spam', targetId: 'x' }).valid).toBe(false);
    expect(validateReportDraft({ targetId: 'x' }).valid).toBe(false);
  });

  it('rejects a missing target', () => {
    expect(validateReportDraft({ reason: 'spam' }).valid).toBe(false);
  });
});

describe('buildReportPayload', () => {
  it('builds the 0226 column shape with a canonical target type', () => {
    const payload = buildReportPayload({
      targetType: 'wish',
      targetId: 42 as unknown as string,
      reason: 'spam',
      note: '  fishy  ',
    });
    expect(payload).toEqual({
      target_type: 'post',
      target_id: '42',
      reason: 'spam',
      note: 'fishy',
    });
  });

  it('collapses an empty note to null and caps at 2000 chars', () => {
    expect(
      buildReportPayload({
        targetType: 'post',
        targetId: 'a',
        reason: 'other',
        note: '  ',
      }).note,
    ).toBe(null);
    const long = 'x'.repeat(3000);
    expect(
      buildReportPayload({
        targetType: 'post',
        targetId: 'a',
        reason: 'other',
        note: long,
      }).note?.length,
    ).toBe(2000);
  });
});

describe('isDuplicateReportError', () => {
  it('detects the 23505 unique violation', () => {
    expect(isDuplicateReportError({ code: '23505' })).toBe(true);
    expect(
      isDuplicateReportError({
        message: 'duplicate key value violates unique constraint',
      }),
    ).toBe(true);
  });

  it('ignores other errors and null', () => {
    expect(isDuplicateReportError({ code: '42501', message: 'forbidden' })).toBe(false);
    expect(isDuplicateReportError(null)).toBe(false);
  });
});
