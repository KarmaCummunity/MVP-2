import { describe, it, expect } from 'vitest';
import { canUpgradeVisibility } from '../invariants';

describe('canUpgradeVisibility — INV-V3 (R-MVP-Privacy-9, FR-POST-009)', () => {
  it('allows OnlyMe → FollowersOnly (upgrade by one rank)', () => {
    expect(canUpgradeVisibility('OnlyMe', 'FollowersOnly')).toBe(true);
  });

  it('allows OnlyMe → Public (upgrade by two ranks)', () => {
    expect(canUpgradeVisibility('OnlyMe', 'Public')).toBe(true);
  });

  it('allows FollowersOnly → Public', () => {
    expect(canUpgradeVisibility('FollowersOnly', 'Public')).toBe(true);
  });

  it('rejects Public → FollowersOnly (downgrade)', () => {
    expect(canUpgradeVisibility('Public', 'FollowersOnly')).toBe(false);
  });

  it('rejects Public → OnlyMe (downgrade by two ranks)', () => {
    expect(canUpgradeVisibility('Public', 'OnlyMe')).toBe(false);
  });

  it('rejects FollowersOnly → OnlyMe (downgrade)', () => {
    expect(canUpgradeVisibility('FollowersOnly', 'OnlyMe')).toBe(false);
  });

  it('rejects no-op (Public → Public): strict > comparison, not >=', () => {
    expect(canUpgradeVisibility('Public', 'Public')).toBe(false);
  });

  it('rejects no-op (FollowersOnly → FollowersOnly)', () => {
    expect(canUpgradeVisibility('FollowersOnly', 'FollowersOnly')).toBe(false);
  });

  it('rejects no-op (OnlyMe → OnlyMe)', () => {
    expect(canUpgradeVisibility('OnlyMe', 'OnlyMe')).toBe(false);
  });
});
