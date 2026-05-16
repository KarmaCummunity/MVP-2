import { describe, expect, it } from 'vitest';
import {
  projectActorIdentityForViewer,
  shouldAnonymizeForHideFromCounterpartyOnPartnerSurface,
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
    counterpartyUserId: 'u_partner',
    identityListingHostUserId: null,
    ...overrides,
  };
}

describe('shouldAnonymizeForHideFromCounterpartyOnPartnerSurface (D-31)', () => {
  it('is false when listing host is not the counterparty profile', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        'u_stranger',
        'u_owner',
        'u_partner',
        'u_owner',
      ),
    ).toBe(false);
  });

  it('is false for the counterparty viewer (they know the actor from chat)', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        'u_partner',
        'u_owner',
        'u_partner',
        'u_partner',
      ),
    ).toBe(false);
  });

  it('is true for a third party on the counterparty closed-post profile surface', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        'u_stranger',
        'u_owner',
        'u_partner',
        'u_partner',
      ),
    ).toBe(true);
  });
});

describe('projectActorIdentityForViewer', () => {
  it('returns full profile when exposure Public and viewer is stranger (neutral listing)', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', ctx());
    expect(r.mode).toBe('full');
    expect(r.displayName).toBe('Moshe');
    expect(r.profileNavigableFromPost).toBe(true);
  });

  it('shows full to counterparty even when hideFromCounterparty (D-31)', () => {
    const r = projectActorIdentityForViewer(
      baseActor,
      'Public',
      ctx({
        viewerUserId: 'u_partner',
        isCounterparty: true,
        viewerFollowsActor: true,
        hideFromCounterparty: true,
        identityListingHostUserId: 'u_partner',
      }),
    );
    expect(r.mode).toBe('full');
    expect(r.displayName).toBe('Moshe');
  });

  it('anonymizes owner for third party on counterparty profile when hideFromCounterparty (D-31)', () => {
    const r = projectActorIdentityForViewer(
      baseActor,
      'Public',
      ctx({
        viewerUserId: 'u_stranger',
        hideFromCounterparty: true,
        identityListingHostUserId: 'u_partner',
      }),
    );
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
