import type { ISavedPostsRepository } from '../../ports/ISavedPostsRepository';
import type { Post } from '@kc/domain';

export class FakeSavedPostsRepository implements ISavedPostsRepository {
  lastSavePostId: string | null = null;
  lastUnsavePostId: string | null = null;
  lastIsPostSavedPostId: string | null = null;
  lastListSavedPostsArgs: { limit: number; cursor?: string } | null = null;
  isPostSavedResult = false;
  savedPostsResult: Post[] = [];
  savedPostsNextCursor: string | null = null;

  savePost = async (postId: string): Promise<void> => {
    this.lastSavePostId = postId;
  };

  unsavePost = async (postId: string): Promise<void> => {
    this.lastUnsavePostId = postId;
  };

  isPostSaved = async (postId: string): Promise<boolean> => {
    this.lastIsPostSavedPostId = postId;
    return this.isPostSavedResult;
  };

  listSavedPosts = async (
    limit: number,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor: string | null }> => {
    this.lastListSavedPostsArgs = { limit, cursor };
    return { posts: this.savedPostsResult, nextCursor: this.savedPostsNextCursor };
  };
}
