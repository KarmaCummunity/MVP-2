/** FR-FOLLOW-004 — requester cancels their own pending request. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface CancelFollowRequestInput {
  viewerId: string;
  targetUserId: string;
}

export class CancelFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CancelFollowRequestInput): Promise<void> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.cancelFollowRequest(input.viewerId, input.targetUserId);
  }
}
