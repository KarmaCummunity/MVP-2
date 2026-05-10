// ─────────────────────────────────────────────
// ISearchRepository — Port for universal search
// Mapped to SRS: FR-FEED-017+ (universal search engine)
// ─────────────────────────────────────────────

import type { PostWithOwner } from './IPostRepository';
import type {
  DonationLinkSearchResult,
  SearchFilters,
  UserSearchResult,
} from '@kc/domain';

/** Aggregated results from a universal search across posts, users, and links. */
export interface UniversalSearchResults {
  readonly posts: PostWithOwner[];
  readonly users: UserSearchResult[];
  readonly links: DonationLinkSearchResult[];
  readonly totalCount: number;
}

export interface ISearchRepository {
  /**
   * Searches posts, users, and donation links in parallel.
   * The `viewerId` is forwarded to the posts query so RLS can filter correctly.
   * City filter applies to posts + users only; links are national.
   */
  search(
    query: string,
    filters: SearchFilters,
    viewerId: string | null,
    limits: { posts: number; users: number; links: number },
  ): Promise<UniversalSearchResults>;
}
