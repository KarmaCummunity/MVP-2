import { describe, expect, it } from 'vitest';
import { AdminContentError, isAdminContentError } from '../AdminContentSearch';

describe('AdminContentSearch', () => {
  it('AdminContentError carries code and name', () => {
    const err = new AdminContentError('forbidden', 'no access');
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe('no access');
    expect(err.name).toBe('AdminContentError');
  });

  it('isAdminContentError narrows AdminContentError instances', () => {
    expect(isAdminContentError(new AdminContentError('invalid_input'))).toBe(true);
    expect(isAdminContentError(new Error('other'))).toBe(false);
  });
});
