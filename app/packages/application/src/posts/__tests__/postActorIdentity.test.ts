import { describe, expect, it } from 'vitest';
import {
  projectActorIdentityForViewer,
  type ActorIdentityInput,
} from '@kc/domain';

const baseActor: ActorIdentityInput = {
  userId: 'u_owner',
  displayName: 'Moshe',
  shareHandle: 'moshe',
  avatarUrl: 'https://x/y.jpg',
};

function ctx(
  overrides: Partial<Parameters<typeof projectActorIdentityForViewer>[2]> = {},
): Parameters<typeof projectActorIdentityForViewer>[2] {
  return {
    viewerUserId: 'u_stranger',
    isCounterparty: false,
    viewerFollowsActor: false,
    hideFromCounterparty: false,
    ownerPostVisibilityOnlyMe: false,
    ...overrides,
  };
}

describe('projectActorIdentityForViewer', () => {
  it('returns full profile when exposure Public and viewer is stranger', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', ctx());
    expect(r.mode).toBe('full');
    expect(r.displayName).toBe('Moshe');
    expect(r.profileNavigableFromPost).toBe(true);
  });

  it('hides from counterparty when hideFromCounterparty is set', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', ctx({
      viewerUserId: 'u_partner',
      isCounterparty: true,
      viewerFollowsActor: true,
      hideFromCounterparty: true,
    }));
    expect(r.mode).toBe('anonymous');
    expect(r.profileNavigableFromPost).toBe(false);
  });

  it('forces anonymous to counterparty when owner post is OnlyMe (coupling)', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', ctx({
      viewerUserId: 'u_partner',
      isCounterparty: true,
      viewerFollowsActor: true,
      hideFromCounterparty: false,
      ownerPostVisibilityOnlyMe: true,
    }));
    expect(r.mode).toBe('anonymous');
  });

  it('FollowersOnly hides from stranger', () => {
    const r = projectActorIdentityForViewer(baseActor, 'FollowersOnly', ctx({
      viewerUserId: 'u_stranger',
      viewerFollowsActor: false,
    }));
    expect(r.mode).toBe('anonymous');
  });

  it('FollowersOnly shows full to approved follower', () => {
    const r = projectActorIdentityForViewer(baseActor, 'FollowersOnly', ctx({
      viewerUserId: 'u_fan',
      viewerFollowsActor: true,
    }));
    expect(r.mode).toBe('full');
  });
});
