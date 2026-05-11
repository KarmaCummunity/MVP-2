/** FR-CLOSURE-003 AC1/AC2: distinct chat partners on this post, sorted by recency. */
import type { ClosureCandidate, IPostRepository } from '../ports/IPostRepository';

export interface GetClosureCandidatesInput {
  postId: string;
  ownerId: string;
}

export class GetClosureCandidatesUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(input: GetClosureCandidatesInput): Promise<ClosureCandidate[]> {
    return this.postRepo.getClosureCandidates(input.postId);
  }
}
