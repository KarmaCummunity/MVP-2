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
  it.each([
    'invalid_display_name',
    'biography_too_long',
    'biography_url_forbidden',
    'invalid_city',
    'incomplete_profile_address',
    'invalid_profile_street',
    'invalid_profile_street_number',
  ])('routes %s to the matching errors.profile.* i18n key', (code) => {
    expect(mapEditProfileSaveError(code)).toBe(`[t:errors.profile.${code}]`);
  });
});

describe('mapEditProfileSaveError — substring matching', () => {
  it('matches even when the code is wrapped with surrounding text (e.g. adapter prefix)', () => {
    expect(mapEditProfileSaveError('repo:invalid_display_name@5'))
      .toBe('[t:errors.profile.invalid_display_name]');
  });

  it('longest-prefix wins: invalid_profile_street_number is NOT shadowed by invalid_profile_street', () => {
    // The map literal declares longer keys BEFORE their prefixes so .includes()
    // matches the more-specific one first. Pinning this so a future reorder
    // (e.g. alphabetization) that reintroduces the shadow fails this test.
    expect(mapEditProfileSaveError('invalid_profile_street_number'))
      .toBe('[t:errors.profile.invalid_profile_street_number]');
    expect(mapEditProfileSaveError('invalid_profile_street'))
      .toBe('[t:errors.profile.invalid_profile_street]');
  });

  it('takes the first matching key when a code contains multiple unrelated known substrings', () => {
    // The order is: street_number, street, address, display_name, biography_too_long,
    // biography_url_forbidden, city. None of these unrelated codes overlap, so
    // 'biography_too_long' wins over 'invalid_city' here purely by declaration order.
    const code = 'biography_too_long and invalid_city';
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
