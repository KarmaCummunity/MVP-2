/** FR-FOLLOW-011 — derive the 5-state machine from raw DB signals. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';
import type { FollowStateInfo } from './types';

export interface GetFollowStateInput {
  viewerId: string;
  targetUserId: string;
}

export class GetFollowStateUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: GetFollowStateInput): Promise<FollowStateInfo> {
    if (input.viewerId === input.targetUserId) {
      return { state: 'self' };
    }
    const raw = await this.users.getFollowStateRaw(input.viewerId, input.targetUserId);

    if (!raw.target) {
      throw new FollowError('user_not_found', 'user_not_found');
    }

    if (raw.followingExists) return { state: 'following' };

    const canStartFollowOrRequest = raw.target.accountStatus === 'active';
    const off: Pick<FollowStateInfo, 'followInteractionDisabled'> = canStartFollowOrRequest
      ? {}
      : { followInteractionDisabled: true };

    if (raw.target.privacyMode === 'Public') {
      return { state: 'not_following_public', ...off };
    }

    // Private from here on
    if (raw.pendingRequestExists) return { state: 'request_pending' };
    if (raw.cooldownUntil) {
      return { state: 'cooldown_after_reject', cooldownUntil: raw.cooldownUntil };
    }
    return { state: 'not_following_private_no_request', ...off };
  }
}
