import { describe, it, expect } from 'vitest';
import { FollowError, isFollowError } from '@kc/application';
import { mapFollowError } from '../mapFollowError';

describe('mapFollowError', () => {
  describe('check_violation markers (RAISE from migration 0003 triggers)', () => {
    it('maps self_follow_forbidden → self_follow', () => {
      const out = mapFollowError({ message: 'self_follow_forbidden' });
      expect(isFollowError(out)).toBe(true);
      expect((out as FollowError).code).toBe('self_follow');
    });

    it('maps self_follow_request_forbidden → self_follow', () => {
      const out = mapFollowError({ message: 'self_follow_request_forbidden' });
      expect((out as FollowError).code).toBe('self_follow');
    });

    it('maps blocked_relationship marker → blocked_relationship', () => {
      const out = mapFollowError({ message: 'blocked_relationship' });
      expect((out as FollowError).code).toBe('blocked_relationship');
    });

    it('maps already_following marker → already_following', () => {
      const out = mapFollowError({ message: 'already_following' });
      expect((out as FollowError).code).toBe('already_following');
    });
  });

  describe('cooldown_active extraction', () => {
    it('maps follow_request_cooldown_active without a parsable cooldown_until', () => {
      const out = mapFollowError({ message: 'follow_request_cooldown_active' });
      expect(isFollowError(out)).toBe(true);
      expect((out as FollowError).code).toBe('cooldown_active');
      expect((out as FollowError).cooldownUntil).toBeUndefined();
    });

    it('extracts cooldown_until from the details string when present', () => {
      const out = mapFollowError({
        message: 'follow_request_cooldown_active',
        details: 'cooldown_until=2026-06-01T12:34:56.000Z',
      });
      expect((out as FollowError).code).toBe('cooldown_active');
      expect((out as FollowError).cooldownUntil).toBe('2026-06-01T12:34:56.000Z');
    });

    it('finds cooldown_until in the message body as well as details', () => {
      // The mapper concatenates message + details before matching, so the
      // marker can appear in either column without losing the timestamp.
      const out = mapFollowError({
        message: 'follow_request_cooldown_active cooldown_until=2026-05-20T00:00:00Z',
      });
      expect((out as FollowError).cooldownUntil).toBe('2026-05-20T00:00:00Z');
    });
  });

  describe('Postgres SQLSTATE codes', () => {
    it('23505 + follow_requests_one_pending_per_pair_idx → pending_request_exists', () => {
      const out = mapFollowError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "follow_requests_one_pending_per_pair_idx"',
      });
      expect((out as FollowError).code).toBe('pending_request_exists');
    });

    it('23505 + follow_edges_pkey → already_following (PK collision)', () => {
      const out = mapFollowError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "follow_edges_pkey"',
      });
      expect((out as FollowError).code).toBe('already_following');
    });

    it('42501 with no marker → blocked_relationship (RLS denial surfaces as blocked)', () => {
      const out = mapFollowError({ code: '42501', message: 'new row violates RLS policy' });
      expect((out as FollowError).code).toBe('blocked_relationship');
    });

    it('23505 without a recognised constraint → unknown (no double-handling)', () => {
      const out = mapFollowError({ code: '23505', message: 'duplicate key value' });
      expect((out as FollowError).code).toBe('unknown');
    });
  });

  describe('marker precedence + null safety', () => {
    it('returns unknown for an empty error object', () => {
      const out = mapFollowError({});
      expect((out as FollowError).code).toBe('unknown');
    });

    it('returns unknown when passed null', () => {
      const out = mapFollowError(null);
      expect((out as FollowError).code).toBe('unknown');
    });

    it('returns unknown when passed undefined', () => {
      const out = mapFollowError(undefined);
      expect((out as FollowError).code).toBe('unknown');
    });

    it('returns unknown for an error with no markers (random message)', () => {
      const out = mapFollowError({ message: 'something unrelated' });
      expect((out as FollowError).code).toBe('unknown');
    });

    it('forwards the original error object as cause on every branch', () => {
      const original = { message: 'self_follow_forbidden' };
      const out = mapFollowError(original);
      expect((out as FollowError).cause).toBe(original);
    });

    it('uses the message as the FollowError message for unknown errors', () => {
      const out = mapFollowError({ message: 'some random text' });
      expect(out.message).toBe('some random text');
    });

    it('falls back to "unknown" as the message when no message field is present', () => {
      const out = mapFollowError({});
      expect(out.message).toBe('unknown');
    });

    it('finds a marker in the details column when message is empty', () => {
      // Concatenation is `${message ?? ''} ${details ?? ''}`, so a marker in
      // details alone still matches.
      const out = mapFollowError({ details: 'self_follow_forbidden' });
      expect((out as FollowError).code).toBe('self_follow');
    });
  });
});
