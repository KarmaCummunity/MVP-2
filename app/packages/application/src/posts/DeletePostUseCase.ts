/** FR-POST-010: owner deletes their own open post. RLS enforces ownership + open-status. */
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
