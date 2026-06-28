import type { ProfilePostOwnerContext } from './postWithOwnerFromPost';

type ProfileUserLike = {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  shareHandle: string;
};

/** Owner line for feed-style cards on profile grids. */
export function profilePostOwnerFromUser(
  user: ProfileUserLike,
  fallbackName: string,
): ProfilePostOwnerContext {
  return {
    ownerId: user.userId,
    ownerName: user.displayName?.trim() || fallbackName,
    ownerAvatarUrl: user.avatarUrl ?? null,
    ownerHandle: user.shareHandle,
  };
}
