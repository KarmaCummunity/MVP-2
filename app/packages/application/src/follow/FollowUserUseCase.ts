/** FR-FOLLOW-001 — instant follow on a Public profile (or after request approval). */
import type { FollowEdge } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { FollowError, isFollowError } from './errors';

export interface FollowUserInput {
  viewerId: string;
  targetUserId: string;
}

export interface FollowUserOutput {
  edge: FollowEdge;
}

export class FollowUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: FollowUserInput): Promise<FollowUserOutput> {
    if (input.viewerId === input.targetUserId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    try {
      const edge = await this.users.follow(input.viewerId, input.targetUserId);
      return { edge };
    } catch (err) {
      // FR-FOLLOW-001 AC1 — idempotent on retry.
      if (isFollowError(err) && err.code === 'already_following') {
        return {
          edge: {
            followerId: input.viewerId,
            followedId: input.targetUserId,
            createdAt: new Date().toISOString(),
          },
        };
      }
      throw err;
    }
  }
}
