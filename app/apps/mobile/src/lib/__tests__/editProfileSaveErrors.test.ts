import { describe, it, expect, vi } from 'vitest';

// Mock the i18n module so we get back a deterministic stringified version of
// the lookup key. The real i18n is a heavy init (locales bundle + react-i18next)
// and the function under test only cares about lookup-key → translated-string,
// so an echo-style mock isolates the translation table from the mapping logic.
vi.mock('../../i18n', () => ({
  default: {
    t: (key: string) => `[t:${key}]`,
  },
}));

import { mapEditProfileSaveError } from '../editProfileSaveErrors';

describe('mapEditProfileSaveError — direct exact codes', () => {
  // NOTE: `invalid_profile_street_number` is intentionally NOT in this list
  // because the helper uses `.includes()` + `Object.keys` declaration order,
  // and `invalid_profile_street` (which is a prefix substring) is declared
  // earlier — so it wins. That behavior is pinned by its own test below; this
  // exhaustive list covers the codes whose mapping is unambiguous.
  it.each([
    'invalid_display_name',
    'biography_too_long',
    'biography_url_forbidden',
    'invalid_city',
    'incomplete_profile_address',
    'invalid_profile_street',
  ])('routes %s to the matching errors.profile.* i18n key', (code) => {
    expect(mapEditProfileSaveError(code)).toBe(`[t:errors.profile.${code}]`);
  });
});

describe('mapEditProfileSaveError — substring matching (existing behavior)', () => {
  it('matches even when the code is wrapped with surrounding text (e.g. adapter prefix)', () => {
    expect(mapEditProfileSaveError('repo:invalid_display_name@5'))
      .toBe('[t:errors.profile.invalid_display_name]');
  });

  it('shadowing: invalid_profile_street_number is matched as invalid_profile_street (declaration-order substring win)', () => {
    // The map literal declares `invalid_profile_street` BEFORE
    // `invalid_profile_street_number`. Since `.includes()` is true for both
    // and `.find()` returns the first hit, the longer code is shadowed by
    // its prefix. This is pinned here as known existing behavior — if the
    // map is reordered (or the matcher switched to longest-prefix), this
    // test will flag it.
    expect(mapEditProfileSaveError('invalid_profile_street_number'))
      .toBe('[t:errors.profile.invalid_profile_street]');
  });

  it('takes the FIRST matching key when a code contains multiple unrelated known substrings', () => {
    // 'biography_too_long' comes before 'invalid_profile_street' in the map.
    const code = 'biography_too_long and invalid_profile_street';
    expect(mapEditProfileSaveError(code)).toBe('[t:errors.profile.biography_too_long]');
  });
});

describe('mapEditProfileSaveError — unknown codes', () => {
  it('returns the code verbatim when no known substring matches (no i18n lookup)', () => {
    expect(mapEditProfileSaveError('network_offline')).toBe('network_offline');
  });

  it('returns "" for an empty string (no match, no translation)', () => {
    expect(mapEditProfileSaveError('')).toBe('');
  });

  it('is case-sensitive — uppercase variants are NOT matched', () => {
    expect(mapEditProfileSaveError('INVALID_DISPLAY_NAME')).toBe('INVALID_DISPLAY_NAME');
  });
});
