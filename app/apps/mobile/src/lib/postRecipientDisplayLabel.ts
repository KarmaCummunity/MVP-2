import type { PostWithOwner } from '@kc/application';

/**
 * Marked recipient line for share / cards (FR-POST-021).
 * Mirrors `RecipientCallout` display rules on post detail.
 */
export function postRecipientDisplayLabel(
  recipient: NonNullable<PostWithOwner['recipientUser']>,
  profileNavigable: boolean,
  t: (key: string) => string,
): string {
  if (profileNavigable) {
    return recipient.displayName ?? t('profile.fallbackName');
  }
  return recipient.displayName || t('post.detail.anonymousUser');
}
