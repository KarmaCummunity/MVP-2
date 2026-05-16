/** FR-POST-022 AC3 — whether the current user bookmarked a post. */
import type { ISavedPostsRepository } from '../ports/ISavedPostsRepository';

export class IsPostSavedUseCase {
  constructor(private readonly repo: ISavedPostsRepository) {}

  async execute(postId: string): Promise<boolean> {
    if (!postId.trim()) throw new Error('IsPostSavedUseCase: postId is required');
    return this.repo.isPostSaved(postId);
  }
}
