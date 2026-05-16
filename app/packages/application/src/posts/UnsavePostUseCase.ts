/** FR-POST-022 AC5 — remove a bookmark. */
import type { ISavedPostsRepository } from '../ports/ISavedPostsRepository';

export class UnsavePostUseCase {
  constructor(private readonly repo: ISavedPostsRepository) {}

  async execute(postId: string): Promise<void> {
    if (!postId.trim()) throw new Error('UnsavePostUseCase: postId is required');
    await this.repo.unsavePost(postId);
  }
}
