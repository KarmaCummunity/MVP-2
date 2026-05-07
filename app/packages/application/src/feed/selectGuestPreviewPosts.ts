import type { PostWithOwner } from '../ports/IPostRepository';

const GUEST_PREVIEW_LIMIT = 3;

/**
 * FR-AUTH-014 AC1: guest feed shows the N most recent public, open posts (newest first).
 * Edge: fewer than N → return all eligible; never pad with non-public posts.
 */
export function selectGuestPreviewPosts(posts: PostWithOwner[]): PostWithOwner[] {
  const eligible = posts.filter((p) => p.visibility === 'Public' && p.status === 'open');
  const sorted = [...eligible].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.slice(0, GUEST_PREVIEW_LIMIT);
}
