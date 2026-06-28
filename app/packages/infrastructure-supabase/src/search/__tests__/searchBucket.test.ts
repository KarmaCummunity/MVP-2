import { describe, it, expect } from 'vitest';
import { EMPTY_SEARCH_BUCKET, toSearchBucket } from '../searchBucket';

describe('toSearchBucket', () => {
  it('uses PostgREST count when provided', () => {
    expect(toSearchBucket(['a', 'b'], 42)).toEqual({ items: ['a', 'b'], total: 42 });
  });

  it('falls back to items.length when count is null', () => {
    expect(toSearchBucket(['a'], null)).toEqual({ items: ['a'], total: 1 });
  });

  it('EMPTY_SEARCH_BUCKET is zero total', () => {
    expect(EMPTY_SEARCH_BUCKET).toEqual({ items: [], total: 0 });
  });
});
