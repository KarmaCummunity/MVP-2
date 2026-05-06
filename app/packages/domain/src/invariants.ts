// ─────────────────────────────────────────────
// DOMAIN INVARIANTS — Karma Community
// Mapped to SRS Part III § 3.5
// These are pure functions — no I/O, no imports from infrastructure.
// ─────────────────────────────────────────────

import type { Post, User } from './entities';
import type { PostVisibility } from './value-objects';

// ── Visibility / Privacy ──────────────────────

/**
 * INV-V3: Post visibility can only be upgraded (more public), never downgraded.
 * Mapped to: R-MVP-Privacy-9, FR-POST-009
 */
export function canUpgradeVisibility(
  current: PostVisibility,
  next: PostVisibility,
): boolean {
  const rank: Record<PostVisibility, number> = {
    OnlyMe: 0,
    FollowersOnly: 1,
    Public: 2,
  };
  return rank[next] > rank[current];
}

/**
 * Allowed visibility transitions after publish.
 */
export function allowedVisibilityTransitions(
  current: PostVisibility,
  profilePrivate: boolean,
): PostVisibility[] {
  if (current === 'Public') return [];
  if (current === 'FollowersOnly') return ['Public'];
  // OnlyMe
  const targets: PostVisibility[] = ['Public'];
  if (profilePrivate) targets.unshift('FollowersOnly');
  return targets;
}

/**
 * INV-L1: Active post limit per user.
 * Mapped to: R-MVP-Items-8, R-MVP-Items-14
 */
export const MAX_ACTIVE_POSTS = 20;

export function canCreatePost(user: Pick<User, 'activePostsCountInternal'>): boolean {
  return user.activePostsCountInternal < MAX_ACTIVE_POSTS;
}

/**
 * INV-C3: Excessive reopens trigger moderation queue.
 * Mapped to: R-MVP-Items-7
 */
export const REOPEN_SUSPECT_THRESHOLD = 5;

export function isReopenSuspect(post: Pick<Post, 'reopenCount'>): boolean {
  return post.reopenCount >= REOPEN_SUSPECT_THRESHOLD;
}

/**
 * INV-L2: Max media assets per post.
 * Mapped to: FR-POST-005
 */
export const MAX_MEDIA_ASSETS = 5;

/**
 * INV-L3: Chats have exactly 2 participants.
 */
export const CHAT_PARTICIPANT_COUNT = 2;

/**
 * Follow request cooldown (days).
 * Mapped to: R-MVP-Privacy-12
 */
export const FOLLOW_REQUEST_COOLDOWN_DAYS = 14;

/**
 * Post expiry (days).
 * Mapped to: R-MVP-Items-5
 */
export const POST_EXPIRY_DAYS = 300;

/**
 * Deleted_no_recipient grace period (days).
 * Mapped to: R-MVP-Items-4
 */
export const DELETE_NO_RECIPIENT_GRACE_DAYS = 7;

/**
 * Account deletion re-registration cooldown (days).
 * Mapped to: D-12
 */
export const ACCOUNT_DELETION_COOLDOWN_DAYS = 30;

/**
 * Biography max length.
 * Mapped to: R-MVP-Profile-6
 */
export const BIO_MAX_CHARS = 200;

/**
 * Post title max length.
 */
export const TITLE_MAX_CHARS = 80;

/**
 * Post description max length.
 */
export const DESCRIPTION_MAX_CHARS = 500;

/**
 * Message body max length.
 */
export const MESSAGE_MAX_CHARS = 2000;
