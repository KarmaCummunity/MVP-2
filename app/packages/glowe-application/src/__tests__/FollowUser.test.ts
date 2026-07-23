import { describe, expect, it, vi } from 'vitest';

import type {
  GloweFollowEdge,
  IGloweFollowGateway,
} from '../ports/IGloweFollowGateway';
import { followUser } from '../use-cases/FollowUser';

const VIEWER = 'aaaaaaaa-0000-0000-0000-000000000001';
const TARGET = 'bbbbbbbb-0000-0000-0000-000000000002';

function makeEdge(): GloweFollowEdge {
  return {
    follower_id: VIEWER,
    followed_id: TARGET,
    created_at: '2026-07-22T00:00:00.000Z',
  };
}

function makeFollowGateway(
  overrides: Partial<IGloweFollowGateway> = {},
): IGloweFollowGateway {
  return {
    followCounts: vi.fn(),
    follow: vi.fn(async () => makeEdge()),
    unfollow: vi.fn(),
    getFollowState: vi.fn(),
    listFollowers: vi.fn(),
    listFollowing: vi.fn(),
    publicCounts: vi.fn(),
    ...overrides,
  };
}

describe('followUser', () => {
  it('follows a target user through the gateway', async () => {
    const follow = vi.fn(async () => makeEdge());
    const result = await followUser(
      { follow: makeFollowGateway({ follow }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(follow).toHaveBeenCalledWith(TARGET);
    expect(result).toEqual({ ok: true, edge: makeEdge() });
  });

  it('rejects self-follow before calling the gateway', async () => {
    const follow = vi.fn();
    const result = await followUser(
      { follow: makeFollowGateway({ follow }) },
      { viewerId: VIEWER, targetUserId: VIEWER },
    );

    expect(follow).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: 'self_follow',
      message: "Can't follow this profile",
    });
  });

  it('treats already_following as success', async () => {
    const follow = vi.fn(async () => {
      throw { code: '23505', message: 'follow_edges_pkey' };
    });
    const result = await followUser(
      { follow: makeFollowGateway({ follow }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.edge.follower_id).toBe(VIEWER);
      expect(result.edge.followed_id).toBe(TARGET);
    }
  });

  it('maps blocked_relationship errors', async () => {
    const follow = vi.fn(async () => {
      throw { message: 'blocked_relationship' };
    });
    const result = await followUser(
      { follow: makeFollowGateway({ follow }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(result).toEqual({
      ok: false,
      code: 'blocked_relationship',
      message: "Can't follow this profile",
    });
  });

  it('returns unknown when follow resolves null', async () => {
    const result = await followUser(
      { follow: makeFollowGateway({ follow: vi.fn(async () => null) }) },
      { viewerId: VIEWER, targetUserId: TARGET },
    );

    expect(result).toEqual({
      ok: false,
      code: 'unknown',
      message: 'Something went wrong',
    });
  });
});
