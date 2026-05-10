// app/packages/application/src/follow/errors.ts
// Follow-domain orchestration errors. Mirrors posts/errors.ts.
// Mapped to SRS: FR-FOLLOW-001..009, 011.

export type FollowErrorCode =
  | 'self_follow'
  | 'blocked_relationship'
  | 'already_following'
  | 'cooldown_active'
  | 'pending_request_exists'
  | 'user_not_found'
  | 'privacy_mode_no_change'
  | 'unknown';

export class FollowError extends Error {
  readonly code: FollowErrorCode;
  /** ISO-8601 cooldown_until from DB; only present when code === 'cooldown_active'. */
  readonly cooldownUntil?: string;
  readonly cause?: unknown;

  constructor(
    code: FollowErrorCode,
    message: string,
    opts: { cooldownUntil?: string; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'FollowError';
    this.code = code;
    this.cooldownUntil = opts.cooldownUntil;
    this.cause = opts.cause;
  }
}

export function isFollowError(value: unknown): value is FollowError {
  return value instanceof FollowError;
}
