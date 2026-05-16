/**
 * Per-post actor identity exposure (FR-POST-021).
 * Pure projection — no UI strings (D-23).
 */
export type PostActorIdentityExposure = 'Public' | 'FollowersOnly' | 'Hidden';

export interface ActorIdentityInput {
  userId: string;
  displayName: string;
  shareHandle: string;
  avatarUrl: string | null;
}

export interface ProjectActorViewerContext {
  viewerUserId: string | null;
  viewerFollowsActor: boolean;
  isCounterparty: boolean;
  /** DB column `hide_from_counterparty` — see D-31: third-party viewers on the counterparty's closed-post profile surface. */
  hideFromCounterparty: boolean;
  /** When the post is visible to owner only, the counterparty must not see the owner's identity on post surfaces. */
  ownerPostVisibilityOnlyMe: boolean;
  /** The other participant on this post (`null` if none). */
  counterpartyUserId: string | null;
  /**
   * Profile user id when hydrating a **closed-posts profile grid** (whose tab the viewer opened).
   * Used with `hideFromCounterparty`: mask the actor for third-party viewers only when this equals the actor's counterparty.
   * `null` = neutral (feed, post detail without `fromProfile`, etc.).
   */
  identityListingHostUserId: string | null;
}

export interface ProjectedActorIdentity {
  mode: 'full' | 'anonymous';
  displayName: string;
  shareHandle: string;
  avatarUrl: string | null;
  profileNavigableFromPost: boolean;
}

/** D-26 — owner chose OnlyMe: counterparty never sees owner's identity on post chrome. */
function ownerOnlyMeCounterpartyMask(isCounterparty: boolean, ownerPostVisibilityOnlyMe: boolean): boolean {
  return isCounterparty && ownerPostVisibilityOnlyMe;
}

/**
 * D-31 — `hide_from_counterparty`: third-party viewers (not actor, not counterparty) see anonymous
 * chrome when the listing context is the **counterparty's** profile closed-post surface.
 * The counterparty always sees full identity here (they already know the actor from chat).
 */
export function shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
  hideFromCounterparty: boolean,
  viewerUserId: string | null,
  actorUserId: string,
  counterpartyUserId: string | null,
  identityListingHostUserId: string | null,
): boolean {
  if (!hideFromCounterparty || !counterpartyUserId || !identityListingHostUserId) return false;
  if (identityListingHostUserId !== counterpartyUserId) return false;
  if (viewerUserId !== null && viewerUserId === actorUserId) return false;
  if (viewerUserId !== null && viewerUserId === counterpartyUserId) return false;
  return true;
}

export function projectActorIdentityForViewer(
  actor: ActorIdentityInput,
  exposure: PostActorIdentityExposure,
  ctx: ProjectActorViewerContext,
): ProjectedActorIdentity {
  const isSelf = ctx.viewerUserId !== null && ctx.viewerUserId === actor.userId;
  if (isSelf) {
    return {
      mode: 'full',
      displayName: actor.displayName,
      shareHandle: actor.shareHandle,
      avatarUrl: actor.avatarUrl,
      profileNavigableFromPost: true,
    };
  }

  if (ownerOnlyMeCounterpartyMask(ctx.isCounterparty, ctx.ownerPostVisibilityOnlyMe)) {
    return {
      mode: 'anonymous',
      displayName: '',
      shareHandle: '',
      avatarUrl: null,
      profileNavigableFromPost: false,
    };
  }

  if (
    shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
      ctx.hideFromCounterparty,
      ctx.viewerUserId,
      actor.userId,
      ctx.counterpartyUserId,
      ctx.identityListingHostUserId,
    ) ||
    exposure === 'Hidden'
  ) {
    return {
      mode: 'anonymous',
      displayName: '',
      shareHandle: '',
      avatarUrl: null,
      profileNavigableFromPost: false,
    };
  }

  if (exposure === 'FollowersOnly' && !ctx.viewerFollowsActor) {
    return {
      mode: 'anonymous',
      displayName: '',
      shareHandle: '',
      avatarUrl: null,
      profileNavigableFromPost: false,
    };
  }

  return {
    mode: 'full',
    displayName: actor.displayName,
    shareHandle: actor.shareHandle,
    avatarUrl: actor.avatarUrl,
    profileNavigableFromPost: true,
  };
}
