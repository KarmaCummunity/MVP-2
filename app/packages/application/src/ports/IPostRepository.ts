import type { Post } from '@kc/domain';
import type {
  Address,
  Category,
  FeedSortOrder,
  FeedStatusFilter,
  ItemCondition,
  LocationDisplayLevel,
  LocationFilter,
  PostStatus,
  PostType,
  PostVisibility,
} from '@kc/domain';

/**
 * Filter shape consumed by IPostRepository.getFeed.
 * Mapped to FR-FEED-004 (filter modal), FR-FEED-005 (persisted state),
 * FR-FEED-006 (distance sort).
 *
 * `searchQuery` and `city` (single-string equality) and `includeClosed` and
 * `sortBy: 'newest'|'city'` from the prior shape were dropped:
 *   - search bar moved off the Home Feed (the Universal Search tab owns it).
 *   - `city` equality replaced by `locationFilter` (city + radius).
 *   - `includeClosed` boolean expanded to `statusFilter` 3-mode.
 *   - `sortBy: 'city'` replaced by `sortOrder: 'distance'` with Haversine.
 */
export interface PostFeedFilter {
  type?: PostType;
  categories?: Category[];          // empty/undefined = no category filter
  itemConditions?: ItemCondition[]; // empty/undefined = no condition filter; ignored unless type === 'Give'
  locationFilter?: LocationFilter;  // city + radius (km); undefined = no spatial filter
  statusFilter?: FeedStatusFilter;  // 'open' (default) | 'closed' | 'all'
  sortOrder?: FeedSortOrder;        // 'newest' (default) | 'oldest' | 'distance'
  proximitySortCity?: string;       // city_id of center for distance sort; undefined = viewer's city
  followersOnly?: boolean;          // true = restrict to posts whose owner the viewer follows (FR-FEED-020)
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
  /**
   * Populated when a post is `closed_delivered` and the recipients row was joined.
   * The label rendered on PostDetail depends on `post.type`:
   *   - Give    → "נמסר ל-{recipientUser.displayName}"
   *   - Request → "ניתן על-ידי {recipientUser.displayName}"
   * Tap opens /user/{shareHandle}.
   */
  recipientUser: {
    userId: string;
    displayName: string;
    shareHandle: string;
    avatarUrl: string | null;
  } | null;
  /**
   * Great-circle distance from the proximity-sort center to this post's city.
   * Populated only when the feed query ran with `sortOrder === 'distance'`;
   * `null` otherwise (or when either side lacks coordinates).
   */
  distanceKm: number | null;
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
  /** When set, replaces all `media_assets` rows for the post (FR-POST-008 AC1). */
  mediaAssets?: MediaAssetInput[];
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
