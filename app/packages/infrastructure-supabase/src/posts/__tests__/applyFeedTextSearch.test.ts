import { describe, it, expect } from 'vitest';
import { feedTextSearchOrClause } from '../applyFeedTextSearch';

describe('feedTextSearchOrClause', () => {
  it('escapes ilike wildcards and quote-wraps OR on title/description/category', () => {
    expect(feedTextSearchOrClause('100%')).toBe(
      String.raw`title.ilike."%100\\%%",description.ilike."%100\\%%",category.ilike."%100\\%%"`,
    );
  });

  it('quotes an injected comma/predicate so it stays inside the value (CWE-943)', () => {
    expect(feedTextSearchOrClause('x,title.eq.secret')).toBe(
      'title.ilike."%x,title.eq.secret%",description.ilike."%x,title.eq.secret%",category.ilike."%x,title.eq.secret%"',
    );
  });
});
