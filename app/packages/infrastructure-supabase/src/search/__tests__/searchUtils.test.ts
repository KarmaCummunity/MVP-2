import { describe, it, expect } from 'vitest';
import { escapeIlike, quoteOrValue, findMatchingCategorySlug } from '../searchUtils';

describe('escapeIlike', () => {
  it('returns an empty string unchanged', () => {
    expect(escapeIlike('')).toBe('');
  });

  it('returns a string with no special characters unchanged', () => {
    expect(escapeIlike('hello world')).toBe('hello world');
    expect(escapeIlike('שלום')).toBe('שלום');
    expect(escapeIlike('abc-123.xyz')).toBe('abc-123.xyz');
  });

  it('escapes the wildcard %', () => {
    expect(escapeIlike('%')).toBe('\\%');
    expect(escapeIlike('50%')).toBe('50\\%');
  });

  it('escapes the single-char wildcard _', () => {
    expect(escapeIlike('_')).toBe('\\_');
    expect(escapeIlike('user_name')).toBe('user\\_name');
  });

  it('escapes the literal backslash', () => {
    expect(escapeIlike('\\')).toBe('\\\\');
    expect(escapeIlike('path\\to')).toBe('path\\\\to');
  });

  it('escapes all three special characters in a single string', () => {
    expect(escapeIlike('100%_off\\sale')).toBe('100\\%\\_off\\\\sale');
  });

  it('escapes repeated occurrences independently', () => {
    expect(escapeIlike('%%%')).toBe('\\%\\%\\%');
    expect(escapeIlike('___')).toBe('\\_\\_\\_');
  });

  it('escapes adjacent specials', () => {
    expect(escapeIlike('%_\\')).toBe('\\%\\_\\\\');
  });

  it('does not escape characters outside the ILIKE special set', () => {
    // The square brackets and asterisk are NOT special in standard ILIKE
    // (only %, _, and \\ are). The mapper deliberately leaves them alone.
    expect(escapeIlike('[*]')).toBe('[*]');
    expect(escapeIlike("O'Reilly")).toBe("O'Reilly");
  });
});

describe('quoteOrValue', () => {
  it('wraps a plain value as a double-quoted ilike pattern', () => {
    expect(quoteOrValue('sofa')).toBe('"%sofa%"');
  });

  it('wraps an empty query', () => {
    expect(quoteOrValue('')).toBe('"%%"');
  });

  it('keeps a comma inside the quotes so it cannot open a new predicate', () => {
    expect(quoteOrValue('a,b')).toBe('"%a,b%"');
  });

  it('keeps period, parentheses and colon literal inside the quotes', () => {
    expect(quoteOrValue('a.b(c):d')).toBe('"%a.b(c):d%"');
  });

  it('escapes an embedded double quote so the value cannot break out of the wrapper', () => {
    expect(quoteOrValue('a"b')).toBe('"%a\\"b%"');
  });

  it('escapes a backslash for both the ilike and the postgrest-quote layers', () => {
    // one backslash -> ilike-escaped to two -> quote-escaped to four
    expect(quoteOrValue(String.raw`a\b`)).toBe(String.raw`"%a\\\\b%"`);
  });

  it('still escapes ilike wildcards so % and _ match literally', () => {
    expect(quoteOrValue('50%')).toBe(String.raw`"%50\\%%"`);
    expect(quoteOrValue('user_name')).toBe(String.raw`"%user\\_name%"`);
  });

  it('neutralizes a predicate-injection attempt by quoting the whole value', () => {
    expect(quoteOrValue('x,title.eq.secret')).toBe('"%x,title.eq.secret%"');
  });
});

describe('findMatchingCategorySlug', () => {
  it('returns null for an empty query', () => {
    expect(findMatchingCategorySlug('')).toBeNull();
  });

  it('returns null when no Hebrew category label appears in the query', () => {
    expect(findMatchingCategorySlug('hello world')).toBeNull();
    expect(findMatchingCategorySlug('xyz')).toBeNull();
  });

  describe('label → slug resolution (each known mapping)', () => {
    it.each([
      ['זמן', 'time'],
      ['כסף', 'money'],
      ['אוכל', 'food'],
      ['דיור', 'housing'],
      ['תחבורה', 'transport'],
      ['ידע', 'knowledge'],
      ['חיות', 'animals'],
      ['רפואה', 'medical'],
    ])('resolves exact Hebrew label %s → %s', (label, expected) => {
      expect(findMatchingCategorySlug(label)).toBe(expected);
    });
  });

  it('matches a Hebrew label that appears as a substring of a longer query', () => {
    expect(findMatchingCategorySlug('אני מחפש אוכל לארוחת ערב')).toBe('food');
    expect(findMatchingCategorySlug('צריך תחבורה מחר')).toBe('transport');
  });

  it('returns the first matching label in Object.entries iteration order when multiple labels appear', () => {
    // CATEGORY_HE_TO_SLUG declares the labels in the order
    // זמן, כסף, אוכל, דיור, תחבורה, ידע, חיות, רפואה — Object.entries iterates
    // string keys in insertion order, so זמן wins over אוכל when both appear.
    expect(findMatchingCategorySlug('זמן ואוכל')).toBe('time');
    // Confirm the dependency on iteration order: when only the later label
    // is present, that one is returned.
    expect(findMatchingCategorySlug('אוכל ודיור')).toBe('food');
  });

  it('does not match when only a partial fragment of a Hebrew label is present', () => {
    // 'זמ' is a substring of 'זמן' but does NOT contain the full label.
    // includes() goes in the opposite direction — the query must include
    // the full label, not vice versa.
    expect(findMatchingCategorySlug('זמ')).toBeNull();
    expect(findMatchingCategorySlug('ידע ידע ידעי')).toBe('knowledge');
  });
});
