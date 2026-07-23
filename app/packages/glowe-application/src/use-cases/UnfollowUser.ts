import type { IGloweFollowGateway } from '../ports/IGloweFollowGateway';
import type { FollowErrorCode } from '../helpers/followHelpers';

export type UnfollowUserResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: FollowErrorCode; readonly message: string };

export interface UnfollowUserDeps {
  readonly follow: IGloweFollowGateway;
}

export interface UnfollowUserInput {
  readonly viewerId: string;
  readonly targetUserId: string;
}

export async function unfollowUser(
  deps: UnfollowUserDeps,
  input: UnfollowUserInput,
): Promise<UnfollowUserResult> {
  const viewerId = String(input.viewerId || '');
  const targetUserId = String(input.targetUserId || '');
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return {
      ok: false,
      code: 'self_follow',
      message: "Can't follow this profile",
    };
  }

  const ok = await deps.follow.unfollow(targetUserId);
  if (ok) return { ok: true };
  return { ok: false, code: 'unknown', message: 'Something went wrong' };
}
