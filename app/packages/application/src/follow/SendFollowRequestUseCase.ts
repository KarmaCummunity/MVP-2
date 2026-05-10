/** FR-FOLLOW-003 — send a follow request to a Private profile. */
import type { FollowRequest } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError, isFollowError } from './errors';

export interface SendFollowRequestInput {
  viewerId: string;
  targetUserId: string;
}

export interface SendFollowRequestOutput {
  request: FollowRequest;
}

export class SendFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: SendFollowRequestInput): Promise<SendFollowRequestOutput> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    try {
      const request = await this.users.sendFollowRequest(input.viewerId, input.targetUserId);
      return { request };
    } catch (err) {
      // FR-FOLLOW-003 AC1 — idempotent: a pending row already exists.
      if (isFollowError(err) && err.code === 'pending_request_exists') {
        return {
          request: {
            requesterId: input.viewerId,
            targetId: input.targetUserId,
            createdAt: new Date().toISOString(),
            status: 'pending',
            cooldownUntil: null,
          },
        };
      }
      throw err;
    }
  }
}
