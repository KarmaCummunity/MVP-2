import type {
  GloweFollowEdge,
  IGloweFollowGateway,
} from '../ports/IGloweFollowGateway';
import {
  isAlreadyFollowingError,
  mapFollowError,
  type FollowErrorCode,
} from '../helpers/followHelpers';

export type FollowUserResult =
  | { readonly ok: true; readonly edge: GloweFollowEdge }
  | { readonly ok: false; readonly code: FollowErrorCode; readonly message: string };

export interface FollowUserDeps {
  readonly follow: IGloweFollowGateway;
}

export interface FollowUserInput {
  readonly viewerId: string;
  readonly targetUserId: string;
}

function selfFollowFailure(): FollowUserResult {
  return {
    ok: false,
    code: 'self_follow',
    message: "Can't follow this profile",
  };
}

function syntheticEdge(viewerId: string, targetUserId: string): GloweFollowEdge {
  return {
    follower_id: viewerId,
    followed_id: targetUserId,
    created_at: new Date().toISOString(),
  };
}

function failureFromError(
  err: { readonly code?: string; readonly message?: string; readonly details?: string } | null,
): FollowUserResult {
  const mapped = mapFollowError(err);
  return { ok: false, code: mapped.code, message: mapped.message };
}

export async function followUser(
  deps: FollowUserDeps,
  input: FollowUserInput,
): Promise<FollowUserResult> {
  const viewerId = String(input.viewerId || '');
  const targetUserId = String(input.targetUserId || '');
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return selfFollowFailure();
  }

  try {
    const edge = await deps.follow.follow(targetUserId);
    if (edge) return { ok: true, edge };
    return failureFromError(null);
  } catch (err) {
    if (isAlreadyFollowingError(err as { code?: string; message?: string; details?: string })) {
      return { ok: true, edge: syntheticEdge(viewerId, targetUserId) };
    }
    return failureFromError(err as { code?: string; message?: string; details?: string });
  }
}
