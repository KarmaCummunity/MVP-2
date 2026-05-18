import { describe, it, expect } from 'vitest';
import {
  filterItems,
  freeTextSelection,
  shouldShowFreeTextRow,
} from '../searchablePickerLogic';

interface Item { id: string; name: string }
const ITEMS: Item[] = [
  { id: '1', name: 'אלנבי' },
  { id: '2', name: 'בן יהודה' },
  { id: '3', name: 'גורדון' },
];
const includes = (it: Item, q: string) => it.name.includes(q);
const renderItem = (it: Item) => ({ id: it.id, name: it.name });

describe('filterItems', () => {
  it('returns [] when items is null', () => {
    expect(filterItems(null, '', includes)).toEqual([]);
  });

  it('returns [] when items is undefined', () => {
    expect(filterItems(undefined, '', includes)).toEqual([]);
  });

  it('returns the full list when the query is empty', () => {
    expect(filterItems(ITEMS, '', includes)).toEqual(ITEMS);
  });

  it('returns the full list when the query is only whitespace', () => {
    expect(filterItems(ITEMS, '   ', includes)).toEqual(ITEMS);
  });

  it('returns matching items via the caller predicate', () => {
    expect(filterItems(ITEMS, 'בן', includes)).toEqual([ITEMS[1]]);
  });

  it('trims the query before applying the predicate', () => {
    expect(filterItems(ITEMS, '  בן  ', includes)).toEqual([ITEMS[1]]);
  });

  it('returns [] when no item matches', () => {
    expect(filterItems(ITEMS, 'XYZ', includes)).toEqual([]);
  });

  it('does not mutate the input list', () => {
    const before = [...ITEMS];
    filterItems(ITEMS, 'בן', includes);
    expect(ITEMS).toEqual(before);
  });
});

describe('shouldShowFreeTextRow', () => {
  it('returns false when allowFreeText is undefined', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: undefined, query: 'אבג', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns false when allowFreeText is false', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: false, query: 'אבג', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns false when the query is empty', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: '', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns false when the query is only whitespace', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: '   ', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns false when the query exactly matches a canonical row name', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: 'אלנבי', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns false when the query exactly matches a canonical row name after trim', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: '  אלנבי  ', items: ITEMS, renderRow: renderItem }),
    ).toBe(false);
  });

  it('returns true when the query has no exact match', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: 'רחוב חדש', items: ITEMS, renderRow: renderItem }),
    ).toBe(true);
  });

  it('returns true when items is null and the query is non-empty', () => {
    // Covers the disabled-by-city or pre-fetch state where no canonical
    // list is available but the user still typed something.
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: 'רחוב חדש', items: null, renderRow: renderItem }),
    ).toBe(true);
  });

  it('returns true when items is the empty array', () => {
    // Covers small settlements (no canonical streets in the source).
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: 'דרך השדה', items: [], renderRow: renderItem }),
    ).toBe(true);
  });

  it('treats partial matches as non-exact (free-text row still shows)', () => {
    expect(
      shouldShowFreeTextRow({ allowFreeText: true, query: 'אלנ', items: ITEMS, renderRow: renderItem }),
    ).toBe(true);
  });
});

describe('freeTextSelection', () => {
  it('emits empty id and the trimmed query as the name', () => {
    expect(freeTextSelection('  אלנבי  ')).toEqual({ id: '', name: 'אלנבי' });
  });

  it('trims internal whitespace only at the edges (preserves middle spaces)', () => {
    expect(freeTextSelection('  שדרת רוטשילד  ')).toEqual({ id: '', name: 'שדרת רוטשילד' });
  });

  it('returns empty name for a fully-whitespace input (caller should also guard via shouldShowFreeTextRow)', () => {
    expect(freeTextSelection('   ')).toEqual({ id: '', name: '' });
  });
});
