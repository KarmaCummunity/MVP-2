import { describe, it, expect } from 'vitest';
import type { LastAddress } from '../../store/lastAddressStore';
import {
  mergeCreatePostAddressPrefill,
  type ProfileAddressPrefillSource,
} from '../mergeCreatePostAddressPrefill';

const EMPTY_LAST: LastAddress = {
  cityId: null,
  cityName: null,
  street: '',
  streetNumber: '',
};

const PROFILE: ProfileAddressPrefillSource = {
  city: 'IL-001',
  cityName: 'Tel Aviv',
  profileStreet: 'Allenby',
  profileStreetNumber: '99',
};

const LAST_FULL: LastAddress = {
  cityId: 'IL-002',
  cityName: 'Haifa',
  street: 'Herzl',
  streetNumber: '5',
};

describe('mergeCreatePostAddressPrefill — city resolution', () => {
  it('prefers profile city when both city + cityName are set, regardless of last-address city', () => {
    expect(mergeCreatePostAddressPrefill(PROFILE, LAST_FULL).city).toEqual({
      id: 'IL-001',
      name: 'Tel Aviv',
    });
  });

  it('falls back to last-address city when profile is null', () => {
    expect(mergeCreatePostAddressPrefill(null, LAST_FULL).city).toEqual({
      id: 'IL-002',
      name: 'Haifa',
    });
  });

  it('falls back to last-address city when profile.city is the empty string (incomplete profile)', () => {
    const incomplete: ProfileAddressPrefillSource = { ...PROFILE, city: '' };
    expect(mergeCreatePostAddressPrefill(incomplete, LAST_FULL).city).toEqual({
      id: 'IL-002',
      name: 'Haifa',
    });
  });

  it('falls back to last-address city when profile.cityName is the empty string', () => {
    const incomplete: ProfileAddressPrefillSource = { ...PROFILE, cityName: '' };
    expect(mergeCreatePostAddressPrefill(incomplete, LAST_FULL).city).toEqual({
      id: 'IL-002',
      name: 'Haifa',
    });
  });

  it('returns city=null when neither profile NOR last has both id + name', () => {
    expect(mergeCreatePostAddressPrefill(null, EMPTY_LAST).city).toBeNull();
  });

  it('returns city=null when last has only id but no name (incomplete last)', () => {
    const partialLast: LastAddress = { ...EMPTY_LAST, cityId: 'IL-002' };
    expect(mergeCreatePostAddressPrefill(null, partialLast).city).toBeNull();
  });
});

describe('mergeCreatePostAddressPrefill — street resolution', () => {
  it('prefers profile street (trimmed) when non-empty', () => {
    const merged = mergeCreatePostAddressPrefill(
      { ...PROFILE, profileStreet: '  Allenby  ' },
      LAST_FULL,
    );
    expect(merged.street).toBe('Allenby');
  });

  it('falls back to last.street when profile.profileStreet is null', () => {
    expect(
      mergeCreatePostAddressPrefill({ ...PROFILE, profileStreet: null }, LAST_FULL).street,
    ).toBe('Herzl');
  });

  it('falls back to last.street when profile.profileStreet is empty after trim', () => {
    expect(
      mergeCreatePostAddressPrefill({ ...PROFILE, profileStreet: '   ' }, LAST_FULL).street,
    ).toBe('Herzl');
  });

  it('returns "" when both profile and last have no street', () => {
    expect(mergeCreatePostAddressPrefill(null, EMPTY_LAST).street).toBe('');
  });
});

describe('mergeCreatePostAddressPrefill — streetNumber resolution', () => {
  it('prefers profile streetNumber (trimmed) when non-empty', () => {
    expect(
      mergeCreatePostAddressPrefill({ ...PROFILE, profileStreetNumber: '  12A  ' }, LAST_FULL)
        .streetNumber,
    ).toBe('12A');
  });

  it('falls back to last.streetNumber when profile.profileStreetNumber is null', () => {
    expect(
      mergeCreatePostAddressPrefill({ ...PROFILE, profileStreetNumber: null }, LAST_FULL)
        .streetNumber,
    ).toBe('5');
  });

  it('falls back to last.streetNumber when profile.profileStreetNumber is whitespace-only', () => {
    expect(
      mergeCreatePostAddressPrefill({ ...PROFILE, profileStreetNumber: '\t' }, LAST_FULL)
        .streetNumber,
    ).toBe('5');
  });
});

describe('mergeCreatePostAddressPrefill — composite behaviour', () => {
  it('lines merge independently: profile city + last street + last streetNumber', () => {
    const partialProfile: ProfileAddressPrefillSource = {
      city: 'IL-001', cityName: 'Tel Aviv',
      profileStreet: null, profileStreetNumber: null,
    };
    expect(mergeCreatePostAddressPrefill(partialProfile, LAST_FULL)).toEqual({
      city: { id: 'IL-001', name: 'Tel Aviv' },
      street: 'Herzl',
      streetNumber: '5',
    });
  });

  it('null profile + empty last → fully-empty merged result', () => {
    expect(mergeCreatePostAddressPrefill(null, EMPTY_LAST)).toEqual({
      city: null,
      street: '',
      streetNumber: '',
    });
  });
});
