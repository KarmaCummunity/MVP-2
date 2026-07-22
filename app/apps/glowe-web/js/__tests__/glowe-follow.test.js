import { describe, it, expect } from 'vitest';
import GloweFollow from '../glowe-follow.js';

const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';

describe('deriveButtonState', () => {
  it('returns self when viewer equals target', () => {
    expect(GloweFollow.deriveButtonState({}, ME, ME).state).toBe('self');
  });

  it('returns following when edge exists', () => {
    const raw = {
      target: { userId: OTHER, privacyMode: 'Public', accountStatus: 'active' },
      followingExists: true
    };
    expect(GloweFollow.deriveButtonState(raw, ME, OTHER)).toMatchObject({
      state: 'following', label: 'Following ✓'
    });
  });

  it('returns not_following_public for public target', () => {
    const raw = {
      target: { userId: OTHER, privacyMode: 'Public', accountStatus: 'active' },
      followingExists: false
    };
    expect(GloweFollow.deriveButtonState(raw, ME, OTHER)).toMatchObject({
      state: 'not_following_public', label: '+ Follow'
    });
  });

  it('returns private_account for private target without edge', () => {
    const raw = {
      target: { userId: OTHER, privacyMode: 'Private', accountStatus: 'active' },
      followingExists: false
    };
    expect(GloweFollow.deriveButtonState(raw, ME, OTHER).state).toBe('private_account');
  });

  it('returns unavailable when account is not active', () => {
    const raw = {
      target: { userId: OTHER, privacyMode: 'Public', accountStatus: 'suspended' },
      followingExists: false
    };
    expect(GloweFollow.deriveButtonState(raw, ME, OTHER).state).toBe('unavailable');
  });

  it('returns unavailable when target missing', () => {
    expect(GloweFollow.deriveButtonState({ target: null }, ME, OTHER).state).toBe('unavailable');
  });
});

describe('followButtonHtml', () => {
  it('returns empty for self and private_account', () => {
    expect(GloweFollow.followButtonHtml({ state: 'self' }, OTHER)).toBe('');
    expect(GloweFollow.followButtonHtml({ state: 'private_account' }, OTHER)).toBe('');
  });

  it('renders follow and following buttons', () => {
    const follow = GloweFollow.followButtonHtml(
      { state: 'not_following_public', label: '+ Follow' }, OTHER
    );
    expect(follow).toContain('data-follow-target="' + OTHER + '"');
    expect(follow).toContain('+ Follow');
    const following = GloweFollow.followButtonHtml(
      { state: 'following', label: 'Following ✓' }, OTHER
    );
    expect(following).toContain('follow-btn--following');
  });
});

describe('connectionsPageUrl / mapFollowListRow', () => {
  it('builds encoded connections URL', () => {
    expect(GloweFollow.connectionsPageUrl(OTHER, 'followers'))
      .toBe('connections.html?user=' + encodeURIComponent(OTHER) + '&tab=followers');
  });

  it('maps list row preferring glowe profile name', () => {
    const row = GloweFollow.mapFollowListRow(
      { user_id: OTHER, display_name: 'KC Name', avatar_url: null },
      { id: OTHER, name: 'GloWe Name', avatarUrl: 'https://x/a.png' }
    );
    expect(row).toMatchObject({
      userId: OTHER, name: 'GloWe Name', avatarUrl: 'https://x/a.png',
      profileHref: 'profile.html?id=' + encodeURIComponent(OTHER)
    });
  });
});

describe('mapFollowError', () => {
  it('treats PK conflict as already_following', () => {
    expect(GloweFollow.isAlreadyFollowingError({
      code: '23505', message: 'follow_edges_pkey'
    })).toBe(true);
  });

  it('maps blocked_relationship', () => {
    expect(GloweFollow.mapFollowError({
      message: 'blocked_relationship'
    }).code).toBe('blocked_relationship');
  });
});
