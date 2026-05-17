// Hydrate IPostRepository.PostWithOwner from a domain Post for UI surfaces
// that only fetch the post row (profile grids) but reuse feed components
// such as PostMenuButton / PostMenuSheet (FR-POST-010, FR-POST-022).
import type { Post } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';

export function postWithOwnerFromPost(post: Post): PostWithOwner {
  return {
    ...post,
    ownerName: null,
    ownerAvatarUrl: null,
    ownerHandle: '',
    ownerPrivacyMode: 'Public',
    recipientUser: null,
    distanceKm: null,
  };
}
