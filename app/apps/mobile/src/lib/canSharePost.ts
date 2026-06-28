// FR-POST-023 — visibility gate for the post-detail share affordance.
//
// Third-party viewers may share only Public posts. Either participant on a
// closed_delivered post (owner or marked recipient) may always share — even
// after Hide / surface_visibility / counterparty privacy choices.

import type { PostWithOwner } from '@kc/application';

const SHAREABLE_STATUSES = ['open', 'closed_delivered'] as const;

function isMarkedRecipient(post: PostWithOwner, viewerId: string): boolean {
  if (post.recipientUser?.userId === viewerId) return true;
  return post.recipient?.recipientUserId === viewerId;
}

function isClosedParticipant(post: PostWithOwner, viewerId: string | null): boolean {
  if (viewerId === null || post.status !== 'closed_delivered') return false;
  return post.ownerId === viewerId || isMarkedRecipient(post, viewerId);
}

export function canSharePost(post: PostWithOwner, viewerId: string | null): boolean {
  if (!SHAREABLE_STATUSES.includes(post.status as (typeof SHAREABLE_STATUSES)[number])) return false;
  if (isClosedParticipant(post, viewerId)) return true;
  return post.visibility === 'Public';
}
