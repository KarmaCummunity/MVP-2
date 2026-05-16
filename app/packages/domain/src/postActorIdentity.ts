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
  hideFromCounterparty: boolean;
  /** When the post is visible to owner only, the counterparty must not see the owner's identity on post surfaces. */
  ownerPostVisibilityOnlyMe: boolean;
}

export interface ProjectedActorIdentity {
  mode: 'full' | 'anonymous';
  displayName: string;
  shareHandle: string;
  avatarUrl: string | null;
  profileNavigableFromPost: boolean;
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

  const counterpartyMask =
    ctx.isCounterparty && (ctx.hideFromCounterparty || ctx.ownerPostVisibilityOnlyMe);

  if (counterpartyMask || exposure === 'Hidden') {
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
