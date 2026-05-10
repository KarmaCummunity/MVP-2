import type { Post } from '@kc/domain';
import type {
  Address,
  Category,
  ItemCondition,
  LocationDisplayLevel,
  PostStatus,
  PostType,
  PostVisibility,
} from '@kc/domain';

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

/** FR-CLOSURE-003 AC1/AC2 — chat-partner candidate for the recipient picker. */
export interface ClosureCandidate {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  cityName: string | null;
  /** ISO timestamp of the latest message in the anchored chat. Used for sort. */
  lastMessageAt: string;
}

export interface MediaAssetInput {
  path: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreatePostInput {
  ownerId: string;
  type: PostType;
  visibility: PostVisibility;
  title: string;
  description: string | null;
  category: Category;
  address: Address;
  locationDisplayLevel: LocationDisplayLevel;
  itemCondition: ItemCondition | null;
  urgency: string | null;
  mediaAssets: MediaAssetInput[];
}

export interface UpdatePostInput {
  title?: string;
  description?: string | null;
  category?: Category;
  address?: Address;
  locationDisplayLevel?: LocationDisplayLevel;
  itemCondition?: ItemCondition | null;
  urgency?: string | null;
  visibility?: PostVisibility;
}

export interface IPostRepository {
  // Feed
  getFeed(
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage>;

  // Single post
  findById(postId: string, viewerId: string | null): Promise<PostWithOwner | null>;

  // Mutations
  create(input: CreatePostInput): Promise<Post>;
  update(postId: string, patch: UpdatePostInput): Promise<Post>;
  delete(postId: string): Promise<void>;

  /**
   * FR-ADMIN-009 — flip a post's status to `removed_admin` via the
   * `admin_remove_post` RPC. Server re-checks `is_admin(auth.uid())`;
   * non-admin callers receive a `forbidden` PostError.
   *
   * Idempotent: calling again on an already-removed post is a quiet
   * no-op (no second audit row).
   */
  adminRemove(postId: string): Promise<void>;

  // Closure (FR-CLOSURE-001..005)
  // close: branches inside the impl —
  //   recipientUserId !== null  → RPC `close_post_with_recipient` (atomic insert + status)
  //   recipientUserId === null  → UPDATE status='deleted_no_recipient', delete_after=now()+7d
  // Both paths bump items_given_count via the existing posts trigger; the
  // recipient path also bumps items_received_count via the recipients trigger.
  close(postId: string, recipientUserId: string | null): Promise<Post>;
  // reopen: branches inside the impl —
  //   current status closed_delivered      → RPC `reopen_post_marked` (delete recipient row + status)
  //   current status deleted_no_recipient  → UPDATE status='open', delete_after=null
  reopen(postId: string): Promise<Post>;
  /** Recipient picker source: distinct chat partners on this post, sorted by latest message recency. */
  getClosureCandidates(postId: string): Promise<ClosureCandidate[]>;

  // User's own posts
  getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]>;

  // Stats
  countOpenByUser(userId: string): Promise<number>;
}
