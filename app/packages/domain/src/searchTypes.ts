// ─────────────────────────────────────────────
// SEARCH TYPES — Universal Smart Search
// Mapped to SRS: FR-FEED-017+ (universal search engine)
// ─────────────────────────────────────────────

import type { Category, DonationCategorySlug, PostType } from './value-objects';

// ── Result types ──────────────────────────────

export type SearchResultType = 'post' | 'user' | 'link';

// ── Sort options ──────────────────────────────

export type SearchSortBy = 'relevance' | 'newest' | 'followers';

// ── Filter interface ──────────────────────────

export interface SearchFilters {
  /** Restrict to a specific result type (null = all). */
  resultType?: SearchResultType | null;
  /** Filter posts by Give/Request. */
  postType?: PostType | null;
  /** Filter posts by category. */
  category?: Category | null;
  /** Filter donation links by donation category slug. */
  donationCategory?: DonationCategorySlug | null;
  /** Filter posts + users by city slug. Links are national — city is ignored. */
  city?: string | null;
  /** Sort strategy. */
  sortBy?: SearchSortBy;
  /** Filter users by minimum followers. */
  minFollowers?: number | null;
}

// ── User search result ────────────────────────

export interface UserSearchResult {
  readonly userId: string;
  readonly displayName: string;
  readonly shareHandle: string;
  readonly avatarUrl: string | null;
  readonly biography: string | null;
  readonly city: string;
  readonly cityName: string;
  readonly followersCount: number;
  readonly itemsGivenCount: number;
}

// ── Donation link search result ───────────────

export interface DonationLinkSearchResult {
  readonly id: string;
  readonly categorySlug: DonationCategorySlug;
  readonly categoryLabelHe: string;
  readonly url: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly tags: string | null;
}
