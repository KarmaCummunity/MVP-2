import { escapeIlike } from '../search/searchUtils';

/** FR-FEED-003 — same fields as `searchPosts` in searchQueryHelpers. */
export function feedTextSearchOrClause(query: string): string {
  const esc = escapeIlike(query);
  return `title.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%`;
}
