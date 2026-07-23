import { describe, expect, it, vi } from 'vitest';

import type { IGloweFollowGateway } from '../ports/IGloweFollowGateway';
import { unfollowUser } from '../use-cases/UnfollowUser';

const VIEWER = 'aaaaaaaa-0000-0000-0000-000000000001';
const TARGET = 'bbbbbbbb-0000-0000-0000-000000000002';

function makeFollowGateway(
  overrides: Partial<IGloweFollowGateway> = {},
): IGloweFollowGateway {
  return {
    followCounts: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(async () => true),
    getFollowState: vi.fn(),
    listFollowers: vi.fn(),
    listFollowing: vi.fn(),
    publicCounts: vi.fn(),
    ...overrides,
  };
}

describe('unfollowUser', () => {
  it('unfollows a target user through the gateway', async () => {
    const unfollow = vi.fn(async () => true);
    const result = await unfollowUser(
      { follow: makeFollowGateway({ unfollow }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(unfollow).toHaveBeenCalledWith(TARGET);
    expect(result).toEqual({ ok: true });
  });

  it('rejects self-unfollow before calling the gateway', async () => {
    const unfollow = vi.fn();
    const result = await unfollowUser(
      { follow: makeFollowGateway({ unfollow }) },
      { viewerId: VIEWER, targetUserId: VIEWER },
    );

    expect(unfollow).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: 'self_follow',
      message: "Can't follow this profile",
    });
  });

  it('returns unknown when unfollow fails', async () => {
    const result = await unfollowUser(
      { follow: makeFollowGateway({ unfollow: vi.fn(async () => false) }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(result).toEqual({
      ok: false,
      code: 'unknown',
      message: 'Something went wrong',
    });
  });
});
