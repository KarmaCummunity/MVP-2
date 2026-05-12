/** FR-POST-010: owner deletes their own post when RLS allows (`open` or unlinked `deleted_no_recipient`). */
import type { IPostRepository } from '../ports/IPostRepository';

export interface DeletePostInput {
  postId: string;
}

export class DeletePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: DeletePostInput): Promise<void> {
    await this.repo.delete(input.postId);
  }
}
