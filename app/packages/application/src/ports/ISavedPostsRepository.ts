import type { Post } from '@kc/domain';

/** FR-POST-022 — per-user post bookmarks. */
export interface ISavedPostsRepository {
  savePost(postId: string): Promise<void>;
  unsavePost(postId: string): Promise<void>;
  isPostSaved(postId: string): Promise<boolean>;
  listSavedPosts(
    limit: number,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor: string | null }>;
}
