/** FR-CLOSURE-003 AC1/AC2: distinct chat partners on this post, sorted by recency. */
import type { ClosureCandidate, IPostRepository } from '../ports/IPostRepository';
import { PostError } from './errors';

export interface GetClosureCandidatesInput {
  postId: string;
  ownerId: string;
}

export class GetClosureCandidatesUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(input: GetClosureCandidatesInput): Promise<ClosureCandidate[]> {
    const post = await this.postRepo.findById(input.postId, input.ownerId);
    if (!post) throw new PostError('unknown', 'post_not_found');
    if (post.ownerId !== input.ownerId) {
      throw new PostError('forbidden', 'forbidden');
    }
    return this.postRepo.getClosureCandidates(input.postId);
  }
}
