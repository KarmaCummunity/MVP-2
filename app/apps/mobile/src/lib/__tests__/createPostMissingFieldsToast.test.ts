import { describe, it, expect, vi } from 'vitest';

vi.mock('../../i18n', () => ({
  default: {
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `[t:${key}|${JSON.stringify(params)}]` : `[t:${key}]`,
  },
}));

import { buildCreatePostMissingFieldsToastMessage } from '../createPostMissingFieldsToast';

const COMPLETE_GIVE = {
  isGive: true,
  title: 'Sofa',
  city: { id: 'IL-001', name: 'Tel Aviv' },
  street: 'Main',
  streetNumber: '12',
  uploadsLength: 1,
};

describe('buildCreatePostMissingFieldsToastMessage — non-address only', () => {
  it('returns "" when a Give post has all required fields', () => {
    expect(buildCreatePostMissingFieldsToastMessage(COMPLETE_GIVE)).toBe('');
  });

  it('returns "" when only address fields are missing (inline UX)', () => {
    expect(
      buildCreatePostMissingFieldsToastMessage({
        ...COMPLETE_GIVE,
        city: null,
        street: '',
        streetNumber: '',
      }),
    ).toBe('');
  });

  it('uses missingOne when only title is missing', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, title: '' });
    expect(out).toContain('missingOne');
    expect(out).toContain('fieldTitle');
  });

  it('uses fieldPhoto for a Give post with no uploads', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, uploadsLength: 0 });
    expect(out).toContain('fieldPhoto');
    expect(out).toContain('missingOne');
  });
});
