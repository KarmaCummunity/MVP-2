/** FR-FOLLOW-005 — target accepts a pending request. DB trigger creates the edge. */
import type { IUserRepository } from '../ports/IUserRepository';
import { assertSessionUser } from '../auth/assertSessionUser';
import { FollowError } from './errors';

export interface AcceptFollowRequestInput {
  sessionUserId: string;
  targetId: string;
  requesterId: string;
}

export class AcceptFollowRequestUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: AcceptFollowRequestInput): Promise<void> {
    assertSessionUser(input.sessionUserId, input.targetId);
    if (input.targetId === input.requesterId) {
      throw new FollowError('self_follow', 'self_follow');
    }
    await this.users.acceptFollowRequest(input.requesterId, input.targetId);
  }
}
