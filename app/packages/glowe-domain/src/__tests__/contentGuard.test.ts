import { describe, it, expect } from 'vitest';
import { canCreateContent, writeGate } from '../contentGuard';

describe('writeGate', () => {
  it('blocks anonymous visitors', () => {
    expect(writeGate(null, false)).toEqual({
      allowed: false,
      reason: 'anon',
    });
  });

  it('blocks unapproved organizations', () => {
    expect(
      writeGate(
        { accountType: 'organization', approvalStatus: 'pending' },
        true,
      ),
    ).toEqual({ allowed: false, reason: 'org-unverified' });
    expect(
      writeGate(
        { accountType: 'organization', approvalStatus: 'rejected' },
        true,
      ),
    ).toEqual({ allowed: false, reason: 'org-unverified' });
  });

  it('allows approved organizations', () => {
    expect(
      writeGate(
        { accountType: 'organization', approvalStatus: 'approved' },
        true,
      ),
    ).toEqual({ allowed: true, reason: 'ok' });
  });

  it('allows individuals without approval', () => {
    expect(
      writeGate({ accountType: 'individual', approvalStatus: 'not_required' }, true),
    ).toEqual({ allowed: true, reason: 'ok' });
    expect(writeGate({}, true)).toEqual({ allowed: true, reason: 'ok' });
  });

  it('reads legacy type field for organizations', () => {
    expect(
      writeGate({ type: 'organization', approvalStatus: 'pending' }, true),
    ).toEqual({ allowed: false, reason: 'org-unverified' });
  });
});

describe('canCreateContent', () => {
  it('returns true only when writeGate allows publishing', () => {
    expect(canCreateContent(null, false)).toBe(false);
    expect(
      canCreateContent(
        { accountType: 'organization', approvalStatus: 'approved' },
        true,
      ),
    ).toBe(true);
    expect(
      canCreateContent(
        { accountType: 'organization', approvalStatus: 'pending' },
        true,
      ),
    ).toBe(false);
  });
});
