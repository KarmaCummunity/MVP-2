import type { PostWithOwner } from '@kc/application';

/**
 * Owner line on post cards / search (FR-POST-021).
 * Must match `postDetailOwnerLabel` in `app/post/[id].tsx`: when identity is masked,
 * show anonymous — not `common.deletedUser`.
 */
export function postOwnerDisplayLabel(
  post: PostWithOwner,
  t: (key: string) => string,
): string {
  const ownerNavigable = post.ownerProfileNavigableFromPost !== false;
  if (!ownerNavigable) return t('post.detail.anonymousUser');
  return post.ownerName ?? t('common.deletedUser');
}
