/** FR-PROFILE-009 / FR-PROFILE-010 — paginated followers list. */
import type { IUserRepository } from '../ports/IUserRepository';
import type { PaginatedUsers } from './types';

const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;

export interface ListFollowersInput {
  userId: string;
  limit?: number;
  cursor?: string;
}

export class ListFollowersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListFollowersInput): Promise<PaginatedUsers> {
    const limit = Math.min(Math.max(input.limit ?? PAGE_DEFAULT, 1), PAGE_MAX);
    const list = await this.users.getFollowers(input.userId, limit, input.cursor);
    const last = list[list.length - 1];
    const nextCursor = list.length === limit && last ? last.userId : null;
    return { users: list, nextCursor };
  }
}
