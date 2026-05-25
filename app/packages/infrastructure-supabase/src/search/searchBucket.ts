// SearchBucket — paginated slice + exact total from a single Supabase query.

export interface SearchBucket<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/** Builds a bucket; falls back to items.length when PostgREST omits count. */
export function toSearchBucket<T>(items: T[], count: number | null): SearchBucket<T> {
  return { items, total: count ?? items.length };
}

export const EMPTY_SEARCH_BUCKET: SearchBucket<never> = { items: [], total: 0 };
