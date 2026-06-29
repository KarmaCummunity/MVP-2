import { describe, it, expect } from 'vitest';
import { OrgHierarchyError, isOrgHierarchyError } from '../OrgHierarchyError';

describe('OrgHierarchyError', () => {
  it('carries the code and defaults the message to the code', () => {
    const err = new OrgHierarchyError('manager_cycle');
    expect(err.code).toBe('manager_cycle');
    expect(err.message).toBe('manager_cycle');
    expect(err.name).toBe('OrgHierarchyError');
  });

  it('keeps an explicit message', () => {
    expect(new OrgHierarchyError('forbidden_manage', 'nope').message).toBe('nope');
  });

  it('isOrgHierarchyError narrows correctly', () => {
    expect(isOrgHierarchyError(new OrgHierarchyError('unknown'))).toBe(true);
    expect(isOrgHierarchyError(new Error('x'))).toBe(false);
    expect(isOrgHierarchyError(null)).toBe(false);
  });
});
