import type {
  CreatePostInput,
  FeedPage,
  IPostRepository,
  PostFeedFilter,
  PostWithOwner,
  UpdatePostInput,
} from '../../ports/IPostRepository';
import type { Post, PostStatus } from '@kc/domain';

/**
 * In-memory IPostRepository for use-case tests. Captures the last call to each
 * method so tests can assert on what the use case forwarded.
 */
export class FakePostRepository implements IPostRepository {
  // Stored data
  posts: PostWithOwner[] = [];
  nextCursor: string | null = null;

  // Call captures
  lastGetFeedArgs: { viewerId: string | null; filter: PostFeedFilter; limit: number; cursor?: string } | null = null;
  lastFindByIdArgs: { postId: string; viewerId: string | null } | null = null;
  lastCreateArgs: CreatePostInput | null = null;
  lastUpdateArgs: { postId: string; patch: UpdatePostInput } | null = null;
  lastDeletePostId: string | null = null;
  lastGetMyPostsArgs: { userId: string; status: PostStatus[]; limit: number; cursor?: string } | null = null;
  lastCountOpenUserId: string | null = null;

  // Stubs / errors
  createResult: Post | null = null;
  createError: Error | null = null;
  updateResult: Post | null = null;
  updateError: Error | null = null;
  findByIdResult: PostWithOwner | null = null;
  findByIdError: Error | null = null;
  deleteError: Error | null = null;
  countOpenResult = 0;
  myPostsResult: Post[] = [];

  getFeed = async (
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage> => {
    this.lastGetFeedArgs = { viewerId, filter, limit, cursor };
    return { posts: this.posts, nextCursor: this.nextCursor };
  };

  findById = async (postId: string, viewerId: string | null): Promise<PostWithOwner | null> => {
    this.lastFindByIdArgs = { postId, viewerId };
    if (this.findByIdError) throw this.findByIdError;
    return this.findByIdResult;
  };

  create = async (input: CreatePostInput): Promise<Post> => {
    this.lastCreateArgs = input;
    if (this.createError) throw this.createError;
    if (!this.createResult) throw new Error('FakePostRepository: createResult not configured');
    return this.createResult;
  };

  update = async (postId: string, patch: UpdatePostInput): Promise<Post> => {
    this.lastUpdateArgs = { postId, patch };
    if (this.updateError) throw this.updateError;
    if (!this.updateResult) throw new Error('FakePostRepository: updateResult not configured');
    return this.updateResult;
  };

  delete = async (postId: string): Promise<void> => {
    this.lastDeletePostId = postId;
    if (this.deleteError) throw this.deleteError;
  };

  close = async (): Promise<Post> => {
    throw new Error('FakePostRepository.close: not used in P0.4-FE');
  };
  reopen = async (): Promise<Post> => {
    throw new Error('FakePostRepository.reopen: not used in P0.4-FE');
  };

  getMyPosts = async (
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]> => {
    this.lastGetMyPostsArgs = { userId, status, limit, cursor };
    return this.myPostsResult;
  };

  countOpenByUser = async (userId: string): Promise<number> => {
    this.lastCountOpenUserId = userId;
    return this.countOpenResult;
  };
}

export function makePostWithOwner(overrides: Partial<PostWithOwner> = {}): PostWithOwner {
  return {
    postId: 'p_1',
    ownerId: 'u_1',
    ownerName: 'Test User',
    ownerAvatarUrl: null,
    ownerHandle: 'test-user',
    ownerPrivacyMode: 'Public',
    type: 'Give',
    status: 'open',
    visibility: 'Public',
    title: 'Test Post',
    description: null,
    category: 'Other',
    address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'Allenby', streetNumber: '10' },
    locationDisplayLevel: 'CityAndStreet',
    itemCondition: 'Good',
    urgency: null,
    mediaAssets: [],
    recipient: null,
    reopenCount: 0,
    deleteAfter: null,
    createdAt: '2026-05-08T10:00:00.000Z',
    updatedAt: '2026-05-08T10:00:00.000Z',
    ...overrides,
  };
}
