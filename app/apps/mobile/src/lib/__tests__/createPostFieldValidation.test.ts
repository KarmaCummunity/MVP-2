import { describe, it, expect, vi } from 'vitest';

vi.mock('../../i18n', () => ({
  default: {
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `[t:${key}|${JSON.stringify(params)}]` : `[t:${key}]`,
  },
}));

import {
  buildAddressInlineErrorMessage,
  buildCreatePostNonAddressToastMessage,
  getAddressValidationIssue,
  hasAddressRequiredFieldGaps,
} from '../createPostFieldValidation';

const COMPLETE = {
  isGive: true,
  title: 'Sofa',
  city: { id: 'IL-001', name: 'Lod' },
  street: 'Main',
  streetNumber: '12',
  uploadsLength: 1,
};

describe('getAddressValidationIssue', () => {
  it('returns none when city, street, and number are set', () => {
    expect(getAddressValidationIssue(COMPLETE.city, COMPLETE.street, COMPLETE.streetNumber)).toBe(
      'none',
    );
  });

  it('returns city when city is null', () => {
    expect(getAddressValidationIssue(null, 'Main', '12')).toBe('city');
  });

  it('returns street when street is blank', () => {
    expect(getAddressValidationIssue(COMPLETE.city, '  ', '12')).toBe('street');
  });

  it('returns streetNumber when number is blank', () => {
    expect(getAddressValidationIssue(COMPLETE.city, 'Main', '')).toBe('streetNumber');
  });

  it('returns streetAndNumber when both street and number are blank', () => {
    expect(getAddressValidationIssue(COMPLETE.city, '', '')).toBe('streetAndNumber');
  });
});

describe('buildAddressInlineErrorMessage', () => {
  it('maps each issue to the matching i18n key', () => {
    expect(buildAddressInlineErrorMessage('street')).toContain('missingStreetBeforePublish');
    expect(buildAddressInlineErrorMessage('streetNumber')).toContain(
      'missingStreetNumberBeforePublish',
    );
    expect(buildAddressInlineErrorMessage('streetAndNumber')).toContain(
      'missingAddressPairBeforePublish',
    );
    expect(buildAddressInlineErrorMessage('city')).toContain('missingCityBeforePublish');
  });
});

describe('buildCreatePostNonAddressToastMessage', () => {
  it('returns "" when only address fields are incomplete', () => {
    expect(
      buildCreatePostNonAddressToastMessage({
        ...COMPLETE,
        city: null,
        street: '',
        streetNumber: '',
      }),
    ).toBe('');
  });

  it('surfaces title when missing', () => {
    const out = buildCreatePostNonAddressToastMessage({ ...COMPLETE, title: '' });
    expect(out).toContain('missingOne');
    expect(out).toContain('fieldTitle');
  });

  it('surfaces photo for Give when missing', () => {
    const out = buildCreatePostNonAddressToastMessage({ ...COMPLETE, uploadsLength: 0 });
    expect(out).toContain('fieldPhoto');
  });
});

describe('hasAddressRequiredFieldGaps', () => {
  it('is true when any address part is missing', () => {
    expect(hasAddressRequiredFieldGaps(null, 'Main', '1')).toBe(true);
    expect(hasAddressRequiredFieldGaps(COMPLETE.city, '', '1')).toBe(true);
  });
});
