import type { Post, Recipient } from '@kc/domain';
import type { Category, PostStatus, PostType, PostVisibility } from '@kc/domain';

export interface PostFeedFilter {
  type?: PostType;
  category?: Category;
  city?: string;
  includeClosed?: boolean;
  searchQuery?: string;
  sortBy?: 'newest' | 'city';
}

export interface FeedPage {
  posts: PostWithOwner[];
  nextCursor: string | null;
}

export interface PostWithOwner extends Post {
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownerHandle: string;
  ownerPrivacyMode: 'Public' | 'Private';
}

export interface IPostRepository {
  // Feed
  getFeed(
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string
  ): Promise<FeedPage>;

  // Single post
  findById(postId: string, viewerId: string | null): Promise<PostWithOwner | null>;

  // Mutations
  create(post: Omit<Post, 'postId' | 'createdAt' | 'updatedAt' | 'reopenCount' | 'deleteAfter' | 'recipient'>): Promise<Post>;
  update(postId: string, patch: Partial<Post>): Promise<Post>;
  delete(postId: string): Promise<void>;

  // Closure
  close(
    postId: string,
    recipientUserId: string | null
  ): Promise<Post>;

  reopen(postId: string): Promise<Post>;

  // User's own posts
  getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string
  ): Promise<Post[]>;

  // Stats
  countOpenByUser(userId: string): Promise<number>;
}
