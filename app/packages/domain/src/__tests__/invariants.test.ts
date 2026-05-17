import { describe, it, expect } from 'vitest';
import { canUpgradeVisibility } from '../invariants';

describe('canUpgradeVisibility — FR-POST-009 / D-32 (non–no-op visibility patch)', () => {
  it('returns true for any pair where current !== next', () => {
    expect(canUpgradeVisibility('OnlyMe', 'FollowersOnly')).toBe(true);
    expect(canUpgradeVisibility('OnlyMe', 'Public')).toBe(true);
    expect(canUpgradeVisibility('FollowersOnly', 'Public')).toBe(true);
    expect(canUpgradeVisibility('FollowersOnly', 'OnlyMe')).toBe(true);
    expect(canUpgradeVisibility('Public', 'FollowersOnly')).toBe(true);
    expect(canUpgradeVisibility('Public', 'OnlyMe')).toBe(true);
  });

  it('returns false when current === next (no-op)', () => {
    expect(canUpgradeVisibility('Public', 'Public')).toBe(false);
    expect(canUpgradeVisibility('FollowersOnly', 'FollowersOnly')).toBe(false);
    expect(canUpgradeVisibility('OnlyMe', 'OnlyMe')).toBe(false);
  });
});
