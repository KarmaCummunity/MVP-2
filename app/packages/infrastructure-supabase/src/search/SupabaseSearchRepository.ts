// SupabaseSearchRepository — thin orchestrator (FR-FEED-017+).
// Query logic: searchExploreHelpers / searchQueryHelpers / searchMappers / searchConstants / searchUtils.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilters } from '@kc/domain';
import type { ISearchRepository, UniversalSearchResults } from '@kc/application';
import type { Database } from '../database.types';
import { explorePosts, exploreUsers, exploreLinks } from './searchExploreHelpers';
import { searchPosts, searchUsers, searchLinks } from './searchQueryHelpers';

export class SupabaseSearchRepository implements ISearchRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async search(
    query: string,
    filters: SearchFilters,
    viewerId: string | null,
    limits: { posts: number; users: number; links: number },
  ): Promise<UniversalSearchResults> {
    const wantPosts = !filters.resultType || filters.resultType === 'post';
    const wantUsers = !filters.resultType || filters.resultType === 'user';
    const wantLinks = !filters.resultType || filters.resultType === 'link';
    const isExplore = !query || query.trim().length === 0;

    const [posts, users, links] = await Promise.all([
      wantPosts
        ? isExplore ? explorePosts(this.client, filters, limits.posts)
                    : searchPosts(this.client, query, filters, limits.posts)
        : Promise.resolve([]),
      wantUsers
        ? isExplore ? exploreUsers(this.client, filters, viewerId, limits.users)
                    : searchUsers(this.client, query, filters, viewerId, limits.users)
        : Promise.resolve([]),
      wantLinks
        ? isExplore ? exploreLinks(this.client, filters, limits.links)
                    : searchLinks(this.client, query, filters, limits.links)
        : Promise.resolve([]),
    ]);

    return { posts, users, links, totalCount: posts.length + users.length + links.length };
  }
}
