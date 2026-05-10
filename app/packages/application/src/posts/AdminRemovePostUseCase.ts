/** FR-ADMIN-009 — Super-admin flips a post's status to `removed_admin`. */
import type { IPostRepository } from '../ports/IPostRepository';

export interface AdminRemovePostInput {
  postId: string;
}

export class AdminRemovePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: AdminRemovePostInput): Promise<void> {
    await this.repo.adminRemove(input.postId);
  }
}
