import { describe, expect, it } from 'vitest';
import {
  projectActorIdentityForViewer,
  shouldAnonymizeForHideFromCounterpartyOnPartnerSurface,
  shouldMaskActorIdentityForThirdPartyViewer,
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
    actorSurfaceVisibility: 'Public',
    counterpartyUserId: 'u_partner',
    identityListingHostUserId: null,
    ...overrides,
  };
}

describe('shouldMaskActorIdentityForThirdPartyViewer (D-31)', () => {
  it('is false when listing host is not the counterparty profile', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        'u_stranger',
        'u_owner',
        'u_partner',
        'u_owner',
      ),
    ).toBe(false);
  });

  it('is false for the counterparty viewer (they know the actor from chat)', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        'u_partner',
        'u_owner',
        'u_partner',
        'u_partner',
      ),
    ).toBe(false);
  });

  it('is true for a third party on the counterparty closed-post profile surface', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        'u_stranger',
        'u_owner',
        'u_partner',
        'u_partner',
      ),
    ).toBe(true);
  });

  it('is true for a third party on post detail (neutral listing host) when hide flag is set', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        'u_stranger',
        'u_owner',
        'u_partner',
        null,
      ),
    ).toBe(true);
  });

  it('is true for a third party on post detail when actor surface is OnlyMe', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        false,
        'OnlyMe',
        'u_stranger',
        'u_owner',
        'u_partner',
        null,
      ),
    ).toBe(true);
  });
});

describe('shouldAnonymizeForHideFromCounterpartyOnPartnerSurface (legacy shim)', () => {
  it('delegates hide flag on neutral surfaces to the new helper', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        'u_stranger',
        'u_owner',
        'u_partner',
        null,
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

  it('anonymizes owner for third party on post detail when hideFromCounterparty', () => {
    const r = projectActorIdentityForViewer(
      baseActor,
      'Public',
      ctx({
        viewerUserId: 'u_stranger',
        hideFromCounterparty: true,
        identityListingHostUserId: null,
      }),
    );
    expect(r.mode).toBe('anonymous');
  });

  it('counterparty always sees actor full even when actor surface is OnlyMe (D-39 dual-surface)', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', ctx({
      viewerUserId: 'u_partner',
      isCounterparty: true,
      viewerFollowsActor: true,
      hideFromCounterparty: true,
      actorSurfaceVisibility: 'OnlyMe',
    }));
    expect(r.mode).toBe('full');
    expect(r.displayName).toBe('Moshe');
  });

  it('anonymizes third party on counterparty profile when actor surface is OnlyMe', () => {
    const r = projectActorIdentityForViewer(
      baseActor,
      'Public',
      ctx({
        viewerUserId: 'u_stranger',
        actorSurfaceVisibility: 'OnlyMe',
        identityListingHostUserId: 'u_partner',
      }),
    );
    expect(r.mode).toBe('anonymous');
  });

  it('anonymizes for third party on neutral surface when actor surface is OnlyMe', () => {
    const r = projectActorIdentityForViewer(
      baseActor,
      'Public',
      ctx({
        viewerUserId: 'u_stranger',
        actorSurfaceVisibility: 'OnlyMe',
      }),
    );
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
