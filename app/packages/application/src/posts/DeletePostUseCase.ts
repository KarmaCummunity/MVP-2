/** FR-POST-010: owner deletes their own post when RLS allows (`open` or unlinked `deleted_no_recipient`). */
import type { IPostRepository } from '../ports/IPostRepository';
import { PostError } from './errors';

export interface DeletePostInput {
  postId: string;
  ownerId: string;
}

export class DeletePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: DeletePostInput): Promise<void> {
    const post = await this.repo.findById(input.postId, input.ownerId);
    if (!post) throw new PostError('unknown', 'post_not_found');
    if (post.ownerId !== input.ownerId) {
      throw new PostError('forbidden', 'forbidden');
    }
    await this.repo.delete(input.postId);
  }
}
