// Hydrate IPostRepository.PostWithOwner from a domain Post for UI surfaces
// that only fetch the post row (profile grids) but reuse feed components
// such as PostMenuButton / PostMenuSheet (FR-POST-010, FR-POST-022).
import type { Post } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';

export type ProfilePostOwnerContext = {
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownerHandle: string;
};

export function postWithOwnerFromPost(
  post: Post,
  owner?: ProfilePostOwnerContext,
): PostWithOwner {
  return {
    ...post,
    ownerName: owner?.ownerName ?? null,
    ownerAvatarUrl: owner?.ownerAvatarUrl ?? null,
    ownerHandle: owner?.ownerHandle ?? '',
    ownerPrivacyMode: 'Public',
    recipientUser: null,
    distanceKm: null,
  };
}
