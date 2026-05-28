import { describe, expect, it } from 'vitest';
import { AdminTaskError, isAdminTaskError } from '../AdminTaskError';

describe('AdminTaskError', () => {
  it('AdminTaskError carries code and defaults message to code', () => {
    const err = new AdminTaskError('task_not_found');
    expect(err.code).toBe('task_not_found');
    expect(err.message).toBe('task_not_found');
    expect(err.name).toBe('AdminTaskError');
  });

  it('isAdminTaskError narrows AdminTaskError instances', () => {
    expect(isAdminTaskError(new AdminTaskError('unknown'))).toBe(true);
    expect(isAdminTaskError(new Error('other'))).toBe(false);
  });
});
