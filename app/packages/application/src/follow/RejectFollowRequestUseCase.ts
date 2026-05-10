/** FR-FOLLOW-006 — target rejects silently; DB trigger sets a 14-day cooldown. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface RejectFollowRequestInput {
  targetId: string;
  requesterId: string;
}

export class RejectFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: RejectFollowRequestInput): Promise<void> {
    if (input.targetId === input.requesterId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.rejectFollowRequest(input.requesterId, input.targetId);
  }
}
