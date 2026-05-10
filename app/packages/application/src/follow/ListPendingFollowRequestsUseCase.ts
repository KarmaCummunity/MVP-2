/** FR-FOLLOW-007 — pending follow-request inbox for Private profile owner. */
import type { IUserRepository } from '../ports/IUserRepository';
import type { PaginatedRequests } from './types';

const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;

export interface ListPendingFollowRequestsInput {
  targetId: string;
  limit?: number;
  cursor?: string;
}

export class ListPendingFollowRequestsUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListPendingFollowRequestsInput): Promise<PaginatedRequests> {
    const limit = Math.min(Math.max(input.limit ?? PAGE_DEFAULT, 1), PAGE_MAX);
    return this.users.getPendingFollowRequestsWithUsers(input.targetId, limit, input.cursor);
  }
}
