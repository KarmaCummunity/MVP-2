// ─────────────────────────────────────────────
// SupabaseSearchRepository — adapter for ISearchRepository
// Mapped to SRS: FR-FEED-017+ (universal search engine)
//
// Strategy:
// 1. Runs 3 parallel queries via Promise.all (posts, users, donation_links).
// 2. Primary filter is ILIKE for reliable Hebrew substring matching — Postgres
//    FTS with 'simple' config is used only for GIN-indexed pre-filtering.
// 3. When the query matches a donation category's Hebrew label (e.g. "כסף"),
//    the links query is broadened to include ALL links in that category so the
//    user can discover links by semantic topic rather than only by literal text.
// 4. Users are NOT filtered by account_status at the app level — RLS policies
//    (`users_select_active`, `users_select_self`) handle visibility correctly.
//    Per D-21, `privacy_mode` is a follow-approval flag only, so Private
//    profiles appear in search results identically to Public ones.
// 5. An "explore" mode (query = '') returns trending/recent content for the
//    discovery feed.
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DonationLinkSearchResult,
  SearchFilters,
  UserSearchResult,
  DonationCategorySlug,
} from '@kc/domain';
import type {
  ISearchRepository,
  UniversalSearchResults,
  PostWithOwner,
} from '@kc/application';
import type { Database } from '../database.types';
import {
  POST_SELECT_OWNER,
  mapPostWithOwnerRow,
  type PostWithOwnerJoinedRow,
} from '../posts/mapPostRow';

// ── Category mappings for smart matching ──────────────────────────────────
// Hebrew labels → category slugs. If a user types "כסף", we also surface
// all donation links in the "money" category — even if the link's display
// name doesn't contain that word.
const CATEGORY_HE_TO_SLUG: Record<string, DonationCategorySlug> = {
  'זמן': 'time',
  'כסף': 'money',
  'אוכל': 'food',
  'דיור': 'housing',
  'תחבורה': 'transport',
  'ידע': 'knowledge',
  'חיות': 'animals',
  'רפואה': 'medical',
};

// Reverse map: slug → Hebrew label for display in search result cards.
const SLUG_TO_LABEL_HE: Record<string, string> = {
  time: 'זמן',
  money: 'כסף',
  food: 'אוכל',
  housing: 'דיור',
  transport: 'תחבורה',
  knowledge: 'ידע',
  animals: 'חיות',
  medical: 'רפואה',
};

// ── Row type for donation_links ────────────────────────────────────────
// The `tags` column is added by migration 0019 but may not yet be reflected
// in the auto-generated database.types.ts. We extend the generated row type.
type LinkRow = Database['public']['Tables']['donation_links']['Row'] & {
  tags?: string | null;
};

// ── Repository ────────────────────────────────────────────────────────────

export class SupabaseSearchRepository implements ISearchRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * Executes a universal search across posts, users, and donation links.
   * When `query` is empty, returns a "discovery" feed (recent posts, active
   * users sorted by followers, and recent links). When `query` is non-empty,
   * filters all three domains by ILIKE substring matching.
   */
  async search(
    query: string,
    filters: SearchFilters,
    viewerId: string | null,
    limits: { posts: number; users: number; links: number },
  ): Promise<UniversalSearchResults> {
    const shouldSearchPosts = !filters.resultType || filters.resultType === 'post';
    const shouldSearchUsers = !filters.resultType || filters.resultType === 'user';
    const shouldSearchLinks = !filters.resultType || filters.resultType === 'link';

    const isExploreMode = !query || query.trim().length === 0;

    // Run all applicable queries in parallel (Promise.all for max throughput)
    const [posts, users, links] = await Promise.all([
      shouldSearchPosts
        ? isExploreMode
          ? this.explorePosts(filters, limits.posts)
          : this.searchPosts(query, filters, limits.posts)
        : Promise.resolve([]),
      shouldSearchUsers
        ? isExploreMode
          ? this.exploreUsers(filters, viewerId, limits.users)
          : this.searchUsers(query, filters, viewerId, limits.users)
        : Promise.resolve([]),
      shouldSearchLinks
        ? isExploreMode
          ? this.exploreLinks(filters, limits.links)
          : this.searchLinks(query, filters, limits.links)
        : Promise.resolve([]),
    ]);

    return {
      posts,
      users,
      links,
      totalCount: posts.length + users.length + links.length,
    };
  }

  // ── Explore mode (no query — discovery feed) ───────────────────────────

  /** Returns recent open posts, newest first. Used for the discovery feed. */
  private async explorePosts(
    filters: SearchFilters,
    limit: number,
  ): Promise<PostWithOwner[]> {
    let q = this.client
      .from('posts')
      .select(POST_SELECT_OWNER)
      .eq('status', 'open');

    if (filters.postType) q = q.eq('type', filters.postType);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.city) q = q.eq('city', filters.city);

    q = q.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`explorePosts: ${error.message}`);

    return ((data ?? []) as unknown as PostWithOwnerJoinedRow[]).map(mapPostWithOwnerRow);
  }

  /** Returns active users sorted by followers desc. Used for discovery. */
  private async exploreUsers(
    filters: SearchFilters,
    viewerId: string | null,
    limit: number,
  ): Promise<UserSearchResult[]> {
    let q = this.client
      .from('users')
      .select(
        'user_id, display_name, share_handle, avatar_url, biography, city, city_name, followers_count, items_given_count',
      );

    // City filter applies to users in explore mode
    if (filters.city) q = q.eq('city', filters.city);
    if (filters.minFollowers && filters.minFollowers > 0) {
      q = q.gte('followers_count', filters.minFollowers);
    }

    q = q.order('followers_count', { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`exploreUsers: ${error.message}`);

    void viewerId;
    return ((data ?? []) as SearchUserRow[]).map(mapUserSearchResult);
  }

  /** Returns recent non-hidden donation links. Used for discovery. */
  private async exploreLinks(
    filters: SearchFilters,
    limit: number,
  ): Promise<DonationLinkSearchResult[]> {
    let q = this.client
      .from('donation_links')
      .select('*')
      .is('hidden_at', null);

    if (filters.donationCategory) {
      q = q.eq('category_slug', filters.donationCategory);
    }

    q = q.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`exploreLinks: ${error.message}`);

    return ((data ?? []) as unknown as LinkRow[]).map(mapLinkSearchResult);
  }

  // ── Search mode (with query) ───────────────────────────────────────────

  /**
   * Search posts by ILIKE on title, description, and category.
   * Sorting: 'newest' → created_at desc; 'relevance' → same (ILIKE has no
   * intrinsic score). RLS ensures only visible posts are returned.
   */
  private async searchPosts(
    query: string,
    filters: SearchFilters,
    limit: number,
  ): Promise<PostWithOwner[]> {
    const escaped = escapeIlike(query);

    let q = this.client
      .from('posts')
      .select(POST_SELECT_OWNER)
      .eq('status', 'open')
      .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,category.ilike.%${escaped}%`);

    if (filters.postType) q = q.eq('type', filters.postType);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.city) q = q.eq('city', filters.city);

    // Both 'relevance' and 'newest' sort by created_at desc because ILIKE
    // doesn't provide a relevance score (unlike ts_rank).
    q = q.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`searchPosts: ${error.message}`);

    return ((data ?? []) as unknown as PostWithOwnerJoinedRow[]).map(mapPostWithOwnerRow);
  }

  /**
   * Search users by ILIKE on display_name, biography, and share_handle.
   * RLS policies handle visibility (public/private); we do NOT add
   * a redundant `account_status = 'active'` filter — RLS already enforces it.
   * The viewer is NOT excluded from results (they may search for themselves).
   */
  private async searchUsers(
    query: string,
    filters: SearchFilters,
    viewerId: string | null,
    limit: number,
  ): Promise<UserSearchResult[]> {
    const escaped = escapeIlike(query);

    let q = this.client
      .from('users')
      .select(
        'user_id, display_name, share_handle, avatar_url, biography, city, city_name, followers_count, items_given_count',
      )
      // No .eq('account_status', 'active') — RLS policies enforce this already.
      // Adding it would double-filter and miss edge cases like self-lookups.
      .or(
        `display_name.ilike.%${escaped}%,biography.ilike.%${escaped}%,share_handle.ilike.%${escaped}%`,
      );

    // City filter applies to users
    if (filters.city) q = q.eq('city', filters.city);
    if (filters.minFollowers && filters.minFollowers > 0) {
      q = q.gte('followers_count', filters.minFollowers);
    }

    // Sorting: 'followers' → desc by followers_count; 'newest' → desc by
    // created_at; 'relevance' → followers desc as a proxy for popularity.
    if (filters.sortBy === 'followers') {
      q = q.order('followers_count', { ascending: false });
    } else if (filters.sortBy === 'newest') {
      q = q.order('created_at', { ascending: false });
    } else {
      q = q.order('followers_count', { ascending: false });
    }

    q = q.limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`searchUsers: ${error.message}`);

    void viewerId;
    return ((data ?? []) as SearchUserRow[]).map(mapUserSearchResult);
  }

  /**
   * Search donation links by ILIKE on display_name, description, and url.
   * Smart category matching: if the query contains a Hebrew category label
   * (e.g. "כסף"), the query is broadened to include ALL links in that
   * donation category — enabling semantic discovery.
   * City filter is NOT applied — links are national/digital resources.
   */
  private async searchLinks(
    query: string,
    filters: SearchFilters,
    limit: number,
  ): Promise<DonationLinkSearchResult[]> {
    const escaped = escapeIlike(query);
    const lowerQuery = query.toLowerCase();

    // Smart category matching: "כסף" → money category links
    const matchedCategorySlug = findMatchingCategorySlug(lowerQuery);

    let q = this.client
      .from('donation_links')
      // Select all columns. The `tags` column is added by migration 0019 but
      // may not be reflected in the generated database.types.ts yet. We cast
      // through `unknown` below (same pattern as PostWithOwnerJoinedRow).
      .select('*')
      .is('hidden_at', null);

    if (matchedCategorySlug && !filters.donationCategory) {
      // Broaden: match text OR match the semantically-matching category
      q = q.or(
        `display_name.ilike.%${escaped}%,description.ilike.%${escaped}%,url.ilike.%${escaped}%,category_slug.eq.${matchedCategorySlug}`,
      );
    } else {
      q = q.or(
        `display_name.ilike.%${escaped}%,description.ilike.%${escaped}%,url.ilike.%${escaped}%`,
      );
    }

    if (filters.donationCategory) {
      q = q.eq('category_slug', filters.donationCategory);
    }

    q = q.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(`searchLinks: ${error.message}`);

    return ((data ?? []) as unknown as LinkRow[]).map(mapLinkSearchResult);
  }

}

// ── Row → domain mappers ──────────────────────────────────────────────────

/** Shape returned by the user SELECT for search results. */
interface SearchUserRow {
  user_id: string;
  display_name: string;
  share_handle: string;
  avatar_url: string | null;
  biography: string | null;
  city: string;
  city_name: string;
  followers_count: number;
  items_given_count: number;
}

/** Maps a raw Supabase user row to the domain UserSearchResult shape. */
function mapUserSearchResult(row: SearchUserRow): UserSearchResult {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    shareHandle: row.share_handle,
    avatarUrl: row.avatar_url,
    biography: row.biography,
    city: row.city,
    cityName: row.city_name,
    followersCount: row.followers_count,
    itemsGivenCount: row.items_given_count,
  };
}

/** Maps a raw Supabase donation link row to the domain DonationLinkSearchResult. */
function mapLinkSearchResult(row: LinkRow): DonationLinkSearchResult {
  return {
    id: row.id,
    categorySlug: row.category_slug as DonationCategorySlug,
    categoryLabelHe: SLUG_TO_LABEL_HE[row.category_slug] ?? row.category_slug,
    url: row.url,
    displayName: row.display_name,
    description: row.description,
    tags: (row as LinkRow).tags ?? null,
  };
}

// ── Utils ─────────────────────────────────────────────────────────────────

/** Escape ILIKE wildcards so user input (%, _, \) is treated literally. */
function escapeIlike(q: string): string {
  return q.replace(/[%_\\]/g, (c) => `\\${c}`);
}

/**
 * If the search query (lowercased) contains a Hebrew donation category label,
 * return the corresponding slug. This enables the "type כסף → find jgive
 * link" flow by broadening the OR condition to include category matches.
 */
function findMatchingCategorySlug(lowerQuery: string): DonationCategorySlug | null {
  for (const [label, slug] of Object.entries(CATEGORY_HE_TO_SLUG)) {
    if (lowerQuery.includes(label)) return slug;
  }
  return null;
}
