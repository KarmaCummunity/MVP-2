// app/packages/application/src/follow/types.ts
// Shared follow-feature types for use-case I/O.
// Mapped to SRS: FR-FOLLOW-011 (state machine), FR-FOLLOW-007 (pending list).

import type { FollowRequest, User } from '@kc/domain';

/** Five UI states from FR-FOLLOW-011 + viewer-is-self. */
export type FollowState =
  | 'self'
  | 'not_following_public'
  | 'following'
  | 'not_following_private_no_request'
  | 'request_pending'
  | 'cooldown_after_reject';

export interface FollowStateInfo {
  state: FollowState;
  /** ISO-8601, present only when state === 'cooldown_after_reject'. */
  cooldownUntil?: string;
}

/** Pending-request row joined with the requester's User profile (FR-FOLLOW-007 AC2). */
export interface FollowRequestWithUser {
  request: FollowRequest;
  requester: User;
}

export interface PaginatedUsers {
  users: User[];
  nextCursor: string | null;
}

export interface PaginatedRequests {
  requests: FollowRequestWithUser[];
  nextCursor: string | null;
}
