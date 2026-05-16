import { describe, it, expect, vi } from 'vitest';

// Echo-style i18n mock: returns the lookup key with interpolated params
// inlined. Lets us assert that the right keys are looked up and the right
// values are forwarded, without depending on the translation table.
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
const COMPLETE_REQUEST = { ...COMPLETE_GIVE, isGive: false, uploadsLength: 0 };

describe('buildCreatePostMissingFieldsToastMessage — completeness', () => {
  it('returns "" when a Give post has all required fields including at least one photo', () => {
    expect(buildCreatePostMissingFieldsToastMessage(COMPLETE_GIVE)).toBe('');
  });

  it('returns "" for a Request post even when uploadsLength=0 (photo not required for Request)', () => {
    expect(buildCreatePostMissingFieldsToastMessage(COMPLETE_REQUEST)).toBe('');
  });

  it('treats whitespace-only title as missing (trims before length check)', () => {
    expect(buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, title: '   ' }))
      .toContain('missingOne');
  });

  it('treats whitespace-only street as missing', () => {
    expect(buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, street: '   ' }))
      .toContain('missingOne');
  });
});

describe('buildCreatePostMissingFieldsToastMessage — single missing field', () => {
  it('uses missingOne template + the single field key when exactly one field is missing', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, title: '' });
    expect(out).toContain('errors.createPost.missingOne');
    expect(out).toContain('errors.createPost.fieldTitle');
  });

  it('uses fieldCity when city is null', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, city: null });
    expect(out).toContain('errors.createPost.fieldCity');
    expect(out).toContain('missingOne');
  });

  it('uses fieldStreetNumber when streetNumber is empty', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, streetNumber: '' });
    expect(out).toContain('errors.createPost.fieldStreetNumber');
    expect(out).toContain('missingOne');
  });

  it('uses fieldPhoto for a Give post with no uploads', () => {
    const out = buildCreatePostMissingFieldsToastMessage({ ...COMPLETE_GIVE, uploadsLength: 0 });
    expect(out).toContain('errors.createPost.fieldPhoto');
    expect(out).toContain('missingOne');
  });

  it('does NOT surface fieldPhoto for a Request post with no uploads (photo gated on isGive)', () => {
    const out = buildCreatePostMissingFieldsToastMessage({
      ...COMPLETE_GIVE,
      isGive: false,
      uploadsLength: 0,
    });
    expect(out).not.toContain('errors.createPost.fieldPhoto');
    expect(out).toBe('');
  });
});

describe('buildCreatePostMissingFieldsToastMessage — many missing fields', () => {
  it('uses missingMany template when 2+ fields are missing, joining with ", "', () => {
    const out = buildCreatePostMissingFieldsToastMessage({
      ...COMPLETE_GIVE,
      title: '',
      city: null,
    });
    expect(out).toContain('errors.createPost.missingMany');
    expect(out).toContain('errors.createPost.fieldTitle');
    expect(out).toContain('errors.createPost.fieldCity');
    // The join separator is ", " — confirm both keys appear in one fields string.
    const fieldsArg = out.match(/"fields":"(.*?)"/)?.[1];
    expect(fieldsArg).toContain(', ');
  });

  it('preserves field order: title → city → street → streetNumber → photo', () => {
    const out = buildCreatePostMissingFieldsToastMessage({
      isGive: true, title: '', city: null, street: '', streetNumber: '', uploadsLength: 0,
    });
    const fieldsArg = out.match(/"fields":"(.*?)"/)?.[1] ?? '';
    const positions = [
      fieldsArg.indexOf('fieldTitle'),
      fieldsArg.indexOf('fieldCity'),
      fieldsArg.indexOf('fieldStreet'),
      fieldsArg.indexOf('fieldStreetNumber'),
      fieldsArg.indexOf('fieldPhoto'),
    ];
    // Strictly increasing → declared order preserved.
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
    }
  });

  it('Request post with everything missing surfaces 4 fields (no photo)', () => {
    const out = buildCreatePostMissingFieldsToastMessage({
      isGive: false, title: '', city: null, street: '', streetNumber: '', uploadsLength: 0,
    });
    expect(out).toContain('missingMany');
    expect(out).toContain('fieldTitle');
    expect(out).toContain('fieldCity');
    expect(out).toContain('fieldStreet');
    expect(out).toContain('fieldStreetNumber');
    expect(out).not.toContain('fieldPhoto');
  });
});
