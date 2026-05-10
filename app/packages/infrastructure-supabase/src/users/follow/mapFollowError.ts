// app/packages/infrastructure-supabase/src/users/follow/mapFollowError.ts
// Postgres error → typed FollowError mapping. See migration 0003 for the
// trigger-raised error names this maps from.

import { FollowError } from '@kc/application';

interface PgErrorShape {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
}

export function mapFollowError(err: unknown): Error {
  const pg = (err ?? {}) as PgErrorShape;
  const text = `${pg.message ?? ''} ${pg.details ?? ''}`;

  // self_follow_forbidden / self_follow_request_forbidden — RAISE check_violation
  if (text.includes('self_follow_forbidden') || text.includes('self_follow_request_forbidden')) {
    return new FollowError('self_follow', text, { cause: err });
  }
  // blocked_relationship — RAISE check_violation
  if (text.includes('blocked_relationship')) {
    return new FollowError('blocked_relationship', text, { cause: err });
  }
  // already_following — RAISE check_violation from follow_requests trigger
  if (text.includes('already_following')) {
    return new FollowError('already_following', text, { cause: err });
  }
  // follow_request_cooldown_active — RAISE check_violation; cooldown_until in detail
  if (text.includes('follow_request_cooldown_active')) {
    const m = text.match(/cooldown_until=([0-9TZ:.+-]+)/);
    return new FollowError('cooldown_active', text, {
      cause: err,
      cooldownUntil: m?.[1],
    });
  }
  // 23505 unique_violation on follow_requests_one_pending_per_pair_idx
  if (pg.code === '23505' && text.includes('follow_requests_one_pending_per_pair_idx')) {
    return new FollowError('pending_request_exists', text, { cause: err });
  }
  // PK conflict on follow_edges → already following
  if (pg.code === '23505' && text.includes('follow_edges_pkey')) {
    return new FollowError('already_following', text, { cause: err });
  }
  // 42501 RLS — surfaced as blocked when invariants are intact
  if (pg.code === '42501') {
    return new FollowError('blocked_relationship', text, { cause: err });
  }
  return new FollowError('unknown', pg.message ?? 'unknown', { cause: err });
}
