/** FR-POST-022 AC2–AC4 — bookmark a post for the signed-in user. */
import type { ISavedPostsRepository } from '../ports/ISavedPostsRepository';

export class SavePostUseCase {
  constructor(private readonly repo: ISavedPostsRepository) {}

  async execute(postId: string): Promise<void> {
    if (!postId.trim()) throw new Error('SavePostUseCase: postId is required');
    await this.repo.savePost(postId);
  }
}
