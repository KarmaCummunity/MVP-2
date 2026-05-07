/** FR-FEED-001..005 + FR-FEED-013: orchestrates a feed page read against IPostRepository. */
import type {
  FeedPage,
  IPostRepository,
  PostFeedFilter,
} from '../ports/IPostRepository';

export interface GetFeedInput {
  viewerId: string | null;
  filter: PostFeedFilter;
  limit?: number;
  cursor?: string;
}

const DEFAULT_LIMIT = 20;
const HARD_MAX = 100;

export class GetFeedUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetFeedInput): Promise<FeedPage> {
    const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, HARD_MAX);
    const filter = normalizeFilter(input.filter);
    return this.repo.getFeed(input.viewerId, filter, limit, input.cursor);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function normalizeFilter(raw: PostFeedFilter): PostFeedFilter {
  const out: PostFeedFilter = { ...raw };
  if (typeof out.searchQuery === 'string') {
    const trimmed = out.searchQuery.trim();
    if (trimmed.length === 0) delete out.searchQuery;
    else out.searchQuery = trimmed;
  }
  return out;
}
