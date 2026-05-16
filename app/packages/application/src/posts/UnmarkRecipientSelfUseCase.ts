/** FR-CLOSURE-007 — recipient removes their own credit from a closed_delivered post. */
import type { IPostRepository } from '../ports/IPostRepository';
import { PostError } from './errors';

export interface UnmarkRecipientSelfInput {
  postId: string;
  userId: string;
}

export class UnmarkRecipientSelfUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: UnmarkRecipientSelfInput): Promise<void> {
    if (!input.postId) throw new PostError('forbidden', 'post_id_required');
    if (!input.userId) throw new PostError('forbidden', 'user_id_required');
    await this.repo.unmrkRecipientSelf(input.postId);
  }
}
