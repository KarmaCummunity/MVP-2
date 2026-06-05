import { describe, it, expect } from 'vitest';
import {
  shouldMaskActorIdentityForThirdPartyViewer,
  shouldAnonymizeForHideFromCounterpartyOnPartnerSurface,
  projectActorIdentityForViewer,
  type ActorIdentityInput,
  type ProjectActorViewerContext,
} from '../postActorIdentity';

// FR-POST-021 actor-identity projection (D-26 / D-31 / D-39).
// Pure logic — exhaustively cover the third-party mask truth table and the
// exposure ladder so a regression in either is caught at the unit level.

const ACTOR = 'actor-1';
const COUNTERPARTY = 'cp-1';
const THIRD_PARTY = 'tp-1';
const HOST_OTHER = 'host-other';

describe('shouldMaskActorIdentityForThirdPartyViewer', () => {
  it('never masks when there is no counterparty (no partner surface)', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(true, 'OnlyMe', THIRD_PARTY, ACTOR, null, null),
    ).toBe(false);
  });

  it('never masks the actor from themselves', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(true, 'OnlyMe', ACTOR, ACTOR, COUNTERPARTY, null),
    ).toBe(false);
  });

  it('never masks the counterparty (they coordinate in chat — D-39)', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'OnlyMe',
        COUNTERPARTY,
        ACTOR,
        COUNTERPARTY,
        null,
      ),
    ).toBe(false);
  });

  it('does not mask when neither hide_from_counterparty nor OnlyMe is set', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(false, 'Public', THIRD_PARTY, ACTOR, COUNTERPARTY, null),
    ).toBe(false);
  });

  it('FollowersOnly surface alone does not request the third-party mask (only OnlyMe does)', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        false,
        'FollowersOnly',
        THIRD_PARTY,
        ACTOR,
        COUNTERPARTY,
        null,
      ),
    ).toBe(false);
  });

  it('masks a third party on a neutral surface (null host) when hide_from_counterparty is set', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(true, 'Public', THIRD_PARTY, ACTOR, COUNTERPARTY, null),
    ).toBe(true);
  });

  it('masks a third party on a neutral surface (null host) when surface_visibility is OnlyMe', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(false, 'OnlyMe', THIRD_PARTY, ACTOR, COUNTERPARTY, null),
    ).toBe(true);
  });

  it("masks when the listing host equals the actor's counterparty", () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        THIRD_PARTY,
        ACTOR,
        COUNTERPARTY,
        COUNTERPARTY,
      ),
    ).toBe(true);
  });

  it('does not mask when the listing host is some other profile (not the counterparty)', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(
        true,
        'Public',
        THIRD_PARTY,
        ACTOR,
        COUNTERPARTY,
        HOST_OTHER,
      ),
    ).toBe(false);
  });

  it('masks a guest viewer (null viewer id) on a neutral surface when requested', () => {
    expect(
      shouldMaskActorIdentityForThirdPartyViewer(true, 'Public', null, ACTOR, COUNTERPARTY, null),
    ).toBe(true);
  });
});

describe('shouldAnonymizeForHideFromCounterpartyOnPartnerSurface (deprecated delegate)', () => {
  it('delegates with a Public surface — masks a third party on the counterparty host', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        THIRD_PARTY,
        ACTOR,
        COUNTERPARTY,
        COUNTERPARTY,
      ),
    ).toBe(true);
  });

  it('masks a third party on a neutral surface when hide_from_counterparty is set', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(true, THIRD_PARTY, ACTOR, COUNTERPARTY, null),
    ).toBe(true);
  });

  it('does not mask when hide_from_counterparty is false (Public surface, no OnlyMe consideration)', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(false, THIRD_PARTY, ACTOR, COUNTERPARTY, null),
    ).toBe(false);
  });

  it('does not mask the counterparty', () => {
    expect(
      shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
        true,
        COUNTERPARTY,
        ACTOR,
        COUNTERPARTY,
        null,
      ),
    ).toBe(false);
  });
});

describe('projectActorIdentityForViewer', () => {
  const actor: ActorIdentityInput = {
    userId: ACTOR,
    displayName: 'Dana',
    shareHandle: 'dana',
    avatarUrl: 'https://cdn.example/avatar.jpg',
  };

  const neutralCtx: ProjectActorViewerContext = {
    viewerUserId: THIRD_PARTY,
    viewerFollowsActor: false,
    isCounterparty: false,
    hideFromCounterparty: false,
    actorSurfaceVisibility: 'Public',
    counterpartyUserId: null,
    identityListingHostUserId: null,
  };

  const fullIdentity = {
    mode: 'full' as const,
    displayName: 'Dana',
    shareHandle: 'dana',
    avatarUrl: 'https://cdn.example/avatar.jpg',
    profileNavigableFromPost: true,
  };

  const anonymousIdentity = {
    mode: 'anonymous' as const,
    displayName: '',
    shareHandle: '',
    avatarUrl: null,
    profileNavigableFromPost: false,
  };

  it('shows full identity to the actor themselves', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Public', { ...neutralCtx, viewerUserId: ACTOR }),
    ).toEqual(fullIdentity);
  });

  it('self short-circuits even when exposure is Hidden', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Hidden', { ...neutralCtx, viewerUserId: ACTOR }),
    ).toEqual(fullIdentity);
  });

  it('shows full identity to a third party for a Public, unmasked post', () => {
    expect(projectActorIdentityForViewer(actor, 'Public', neutralCtx)).toEqual(fullIdentity);
  });

  it('shows full identity to a guest (null viewer) for a Public, unmasked post', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Public', { ...neutralCtx, viewerUserId: null }),
    ).toEqual(fullIdentity);
  });

  it('anonymizes a Hidden post for a non-self viewer', () => {
    expect(projectActorIdentityForViewer(actor, 'Hidden', neutralCtx)).toEqual(anonymousIdentity);
  });

  it('anonymizes a FollowersOnly post for a non-follower', () => {
    expect(projectActorIdentityForViewer(actor, 'FollowersOnly', neutralCtx)).toEqual(
      anonymousIdentity,
    );
  });

  it('shows full identity for a FollowersOnly post to a follower', () => {
    expect(
      projectActorIdentityForViewer(actor, 'FollowersOnly', {
        ...neutralCtx,
        viewerFollowsActor: true,
      }),
    ).toEqual(fullIdentity);
  });

  it('mask wins over an otherwise-Public exposure (third party on counterparty host)', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Public', {
        ...neutralCtx,
        hideFromCounterparty: true,
        counterpartyUserId: COUNTERPARTY,
        identityListingHostUserId: COUNTERPARTY,
      }),
    ).toEqual(anonymousIdentity);
  });

  it('OnlyMe surface anonymizes a third party on a neutral surface', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Public', {
        ...neutralCtx,
        actorSurfaceVisibility: 'OnlyMe',
        counterpartyUserId: COUNTERPARTY,
      }),
    ).toEqual(anonymousIdentity);
  });

  it('never masks the counterparty even when OnlyMe + hide_from_counterparty are set', () => {
    expect(
      projectActorIdentityForViewer(actor, 'Public', {
        ...neutralCtx,
        viewerUserId: COUNTERPARTY,
        hideFromCounterparty: true,
        actorSurfaceVisibility: 'OnlyMe',
        counterpartyUserId: COUNTERPARTY,
      }),
    ).toEqual(fullIdentity);
  });
});
