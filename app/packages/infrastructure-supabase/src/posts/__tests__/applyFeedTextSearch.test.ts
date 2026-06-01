import { describe, it, expect } from 'vitest';
import { feedTextSearchOrClause } from '../applyFeedTextSearch';

describe('feedTextSearchOrClause', () => {
  it('escapes ilike wildcards and builds OR on title/description/category', () => {
    expect(feedTextSearchOrClause('100%')).toBe(
      'title.ilike.%100\\%%,description.ilike.%100\\%%,category.ilike.%100\\%%',
    );
  });
});
