import { quoteOrValue } from '../search/searchUtils';

/** FR-FEED-003 — same fields as `searchPosts` in searchQueryHelpers. */
export function feedTextSearchOrClause(query: string): string {
  const v = quoteOrValue(query);
  return `title.ilike.${v},description.ilike.${v},category.ilike.${v}`;
}
