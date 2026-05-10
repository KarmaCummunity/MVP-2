/** FR-CLOSURE-003 AC1/AC2: distinct chat partners on this post, sorted by recency, blocked filtered. */
import type { ClosureCandidate, IPostRepository } from '../ports/IPostRepository';
import type { IUserRepository } from '../ports/IUserRepository';

export interface GetClosureCandidatesInput {
  postId: string;
  ownerId: string;
}

export class GetClosureCandidatesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: GetClosureCandidatesInput): Promise<ClosureCandidate[]> {
    const [candidates, blocked] = await Promise.all([
      this.postRepo.getClosureCandidates(input.postId),
      this.userRepo.getBlockedUsers(input.ownerId),
    ]);
    const blockedIds = new Set(blocked.map((u) => u.userId));
    return candidates.filter((c) => !blockedIds.has(c.userId));
  }
}
