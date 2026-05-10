/** FR-CLOSURE-003 (extension): "pick from any user" mode. Wraps the user repo
 *  search with closure-specific shape (ClosureCandidate). Used by the search
 *  pane in ClosureSheet's Step 2 when the recipient isn't in the chat list. */
import type { ClosureCandidate } from '../ports/IPostRepository';
import type { IUserRepository } from '../ports/IUserRepository';

export interface SearchUsersForClosureInput {
  query: string;
  ownerId: string;
  limit?: number;
}

export class SearchUsersForClosureUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: SearchUsersForClosureInput): Promise<ClosureCandidate[]> {
    const users = await this.userRepo.searchUsers(input.query, {
      excludeUserId: input.ownerId,
      limit: input.limit ?? 20,
    });
    return users.map((u) => ({
      userId: u.userId,
      fullName: u.displayName,
      avatarUrl: u.avatarUrl,
      cityName: u.cityName ?? null,
      // No "last message" in search mode — leave empty so the row hides the timestamp.
      lastMessageAt: '',
    }));
  }
}
