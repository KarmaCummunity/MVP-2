import { describe, it, expect } from 'vitest';
import {
  getProfileAddressPairIssue,
  isProfileAddressPairValid,
} from '../profileAddressFieldGate';

describe('getProfileAddressPairIssue', () => {
  it('returns null when both street and number are empty (entire address is optional)', () => {
    expect(getProfileAddressPairIssue('', '')).toBeNull();
  });

  it('returns null for whitespace-only on both sides (trims before checking)', () => {
    expect(getProfileAddressPairIssue('   ', '\t \n')).toBeNull();
  });

  it('flags "incomplete_profile_address" when only street is filled', () => {
    expect(getProfileAddressPairIssue('Main', '')).toBe('incomplete_profile_address');
  });

  it('flags "incomplete_profile_address" when only number is filled', () => {
    expect(getProfileAddressPairIssue('', '12')).toBe('incomplete_profile_address');
  });

  it('flags "incomplete_profile_address" when one side is whitespace-only (trim then compare)', () => {
    expect(getProfileAddressPairIssue('Main', '   ')).toBe('incomplete_profile_address');
    expect(getProfileAddressPairIssue('   ', '12')).toBe('incomplete_profile_address');
  });

  it('flags "invalid_profile_street" when street exceeds 80 chars', () => {
    const street = 'a'.repeat(81);
    expect(getProfileAddressPairIssue(street, '12')).toBe('invalid_profile_street');
  });

  it('flags "invalid_profile_street_number" for a non-matching number (letters only, multi-letter suffix, punctuation)', () => {
    expect(getProfileAddressPairIssue('Main', 'A')).toBe('invalid_profile_street_number');
    expect(getProfileAddressPairIssue('Main', '12AB')).toBe('invalid_profile_street_number');
    expect(getProfileAddressPairIssue('Main', '12-A')).toBe('invalid_profile_street_number');
    expect(getProfileAddressPairIssue('Main', '')).toBe('incomplete_profile_address'); // empty wins
  });

  it('accepts a valid pair (digits, digits+letter)', () => {
    expect(getProfileAddressPairIssue('Main', '12')).toBeNull();
    expect(getProfileAddressPairIssue('Main', '12A')).toBeNull();
    expect(getProfileAddressPairIssue('Main', '12a')).toBeNull();
  });

  it('accepts the maximum street length (80 chars)', () => {
    expect(getProfileAddressPairIssue('a'.repeat(80), '12')).toBeNull();
  });

  it('client-side rule rejects Hebrew letter suffix (matches /^\\d+[A-Za-z]?$/, NOT the domain pattern)', () => {
    // The client gate is intentionally stricter than the domain
    // STREET_NUMBER_PATTERN (which accepts Hebrew א..ת). The mismatch is
    // deliberate per the file header — "mirrors CompleteBasicInfoUseCase
    // optional rules" — not the broader domain regex.
    expect(getProfileAddressPairIssue('Main', '12א')).toBe('invalid_profile_street_number');
  });
});

describe('isProfileAddressPairValid', () => {
  it('returns true when getProfileAddressPairIssue returns null (delegated semantics)', () => {
    expect(isProfileAddressPairValid('', '')).toBe(true);
    expect(isProfileAddressPairValid('Main', '12')).toBe(true);
  });

  it('returns false when any issue is reported', () => {
    expect(isProfileAddressPairValid('Main', '')).toBe(false);
    expect(isProfileAddressPairValid('Main', '12-A')).toBe(false);
    expect(isProfileAddressPairValid('a'.repeat(81), '12')).toBe(false);
  });
});
