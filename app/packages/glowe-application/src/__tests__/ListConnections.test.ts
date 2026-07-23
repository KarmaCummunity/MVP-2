import { describe, expect, it, vi } from 'vitest';

import type {
  GloweFollowUserEmbed,
  IGloweFollowGateway,
} from '../ports/IGloweFollowGateway';
import { listConnections } from '../use-cases/ListConnections';

const OWNER = 'aaaaaaaa-0000-0000-0000-000000000001';
const MEMBER = 'bbbbbbbb-0000-0000-0000-000000000002';

function embed(
  overrides: Partial<GloweFollowUserEmbed> = {},
): GloweFollowUserEmbed {
  return {
    user_id: MEMBER,
    display_name: 'KC Name',
    avatar_url: 'https://kc/avatar.png',
    privacy_mode: 'Public',
    account_status: 'active',
    followers_count: 1,
    following_count: 2,
    ...overrides,
  };
}

function makeFollowGateway(
  overrides: Partial<IGloweFollowGateway> = {},
): IGloweFollowGateway {
  return {
    followCounts: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    getFollowState: vi.fn(),
    listFollowers: vi.fn(async () => [embed()]),
    listFollowing: vi.fn(async () => []),
    publicCounts: vi.fn(),
    ...overrides,
  };
}

describe('listConnections', () => {
  it('lists followers and maps rows', async () => {
    const listFollowers = vi.fn(async () => [embed()]);
    const items = await listConnections(
      { follow: makeFollowGateway({ listFollowers }) },
      {
        userId: OWNER,
        tab: 'followers',
        profilesById: {
          [MEMBER]: { id: MEMBER, name: 'GloWe Name', avatarUrl: 'https://glowe/a.png' },
        },
      },
    );

    expect(listFollowers).toHaveBeenCalledWith(OWNER, undefined, undefined);
    expect(items).toEqual([
      {
        userId: MEMBER,
        name: 'GloWe Name',
        avatarUrl: 'https://glowe/a.png',
        profileHref: 'profile.html?id=' + encodeURIComponent(MEMBER),
      },
    ]);
  });

  it('lists following via the following gateway method', async () => {
    const listFollowing = vi.fn(async () => [embed({ user_id: MEMBER, display_name: 'Following User' })]);
    const items = await listConnections(
      { follow: makeFollowGateway({ listFollowing }) },
      { userId: OWNER, tab: 'following' },
    );

    expect(listFollowing).toHaveBeenCalledWith(OWNER, undefined, undefined);
    expect(items[0]).toMatchObject({
      userId: MEMBER,
      name: 'Following User',
      avatarUrl: 'https://kc/avatar.png',
    });
  });

  it('returns an empty array when user id is missing', async () => {
    const listFollowers = vi.fn();
    const items = await listConnections(
      { follow: makeFollowGateway({ listFollowers }) },
      { userId: '', tab: 'followers' },
    );

    expect(listFollowers).not.toHaveBeenCalled();
    expect(items).toEqual([]);
  });

  it('forwards pagination args to the gateway', async () => {
    const listFollowers = vi.fn(async () => []);
    await listConnections(
      { follow: makeFollowGateway({ listFollowers }) },
      { userId: OWNER, tab: 'followers', limit: 25, cursor: 'cur-1' },
    );

    expect(listFollowers).toHaveBeenCalledWith(OWNER, 25, 'cur-1');
  });
});
