import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_STATUSES,
  OrganizationError,
  isOrganizationError,
  parseOrganizationStatus,
} from '../Organization';

describe('parseOrganizationStatus', () => {
  it('accepts every known status', () => {
    for (const s of ORGANIZATION_STATUSES) {
      expect(parseOrganizationStatus(s)).toBe(s);
    }
  });

  it('returns null for unknown / nullish values', () => {
    expect(parseOrganizationStatus('archived')).toBeNull();
    expect(parseOrganizationStatus(null)).toBeNull();
    expect(parseOrganizationStatus(undefined)).toBeNull();
  });
});

describe('OrganizationError', () => {
  it('carries its code and is recognised by the guard', () => {
    const err = new OrganizationError('not_a_member');
    expect(err.code).toBe('not_a_member');
    expect(err.name).toBe('OrganizationError');
    expect(isOrganizationError(err)).toBe(true);
    expect(isOrganizationError(new Error('x'))).toBe(false);
  });
});
