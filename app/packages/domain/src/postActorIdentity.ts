/**
 * Per-post actor identity exposure (FR-POST-021).
 * Pure projection — no UI strings (D-23).
 */
import type { PostVisibility } from './value-objects';

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
  /** DB column `hide_from_counterparty` — see D-31. */
  hideFromCounterparty: boolean;
  /** Participant `surface_visibility`; `OnlyMe` masks third parties on counterparty surfaces (FR-POST-021). */
  actorSurfaceVisibility: PostVisibility;
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

/**
 * D-31 / D-39 — mask actor chrome for third-party viewers when the actor opted out on the
 * counterparty's closed-post surface (`hide_from_counterparty`) or hid their surface (`OnlyMe`).
 * Counterparty always sees full identity (they coordinate in chat) — D-26 owner-OnlyMe
 * counterparty mask was removed by D-39 (dual-surface privacy).
 */
export function shouldMaskActorIdentityForThirdPartyViewer(
  hideFromCounterparty: boolean,
  actorSurfaceVisibility: PostVisibility,
  viewerUserId: string | null,
  actorUserId: string,
  counterpartyUserId: string | null,
  identityListingHostUserId: string | null,
): boolean {
  if (!counterpartyUserId) return false;
  if (viewerUserId !== null && viewerUserId === actorUserId) return false;
  if (viewerUserId !== null && viewerUserId === counterpartyUserId) return false;

  const maskRequested = hideFromCounterparty || actorSurfaceVisibility === 'OnlyMe';
  if (!maskRequested) return false;

  if (identityListingHostUserId === null) return true;

  return identityListingHostUserId === counterpartyUserId;
}

/** @deprecated Use {@link shouldMaskActorIdentityForThirdPartyViewer}. */
export function shouldAnonymizeForHideFromCounterpartyOnPartnerSurface(
  hideFromCounterparty: boolean,
  viewerUserId: string | null,
  actorUserId: string,
  counterpartyUserId: string | null,
  identityListingHostUserId: string | null,
): boolean {
  return shouldMaskActorIdentityForThirdPartyViewer(
    hideFromCounterparty,
    'Public',
    viewerUserId,
    actorUserId,
    counterpartyUserId,
    identityListingHostUserId,
  );
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

  if (
    shouldMaskActorIdentityForThirdPartyViewer(
      ctx.hideFromCounterparty,
      ctx.actorSurfaceVisibility,
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
