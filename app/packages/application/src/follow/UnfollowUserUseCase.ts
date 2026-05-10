/** FR-FOLLOW-002 — hard-delete the FollowEdge. No notification on the way out. */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface UnfollowUserInput {
  viewerId: string;
  targetUserId: string;
}

export class UnfollowUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UnfollowUserInput): Promise<void> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.unfollow(input.viewerId, input.targetUserId);
  }
}
