/** FR-FOLLOW-009 — owner removes a current follower. No notification (AC4). */
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError } from './errors';

export interface RemoveFollowerInput {
  ownerId: string;
  followerId: string;
}

export class RemoveFollowerUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: RemoveFollowerInput): Promise<void> {
    if (input.ownerId === input.followerId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    // Edge orientation: followerId follows ownerId. Either party can DELETE
    // (RLS in 0003: `follow_edges_delete_participants`).
    await this.users.unfollow(input.followerId, input.ownerId);
  }
}
