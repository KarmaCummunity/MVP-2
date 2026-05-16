import type { IPostRepository } from '../ports/IPostRepository';
import type { PostActorIdentityRow } from '../ports/postActorIdentity';

export interface ListPostActorIdentityInput {
  postId: string;
}

/** FR-POST-021 — read per-actor identity rows for a post (RLS-enforced). */
export class ListPostActorIdentityUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: ListPostActorIdentityInput): Promise<PostActorIdentityRow[]> {
    return this.repo.listPostActorIdentities(input.postId);
  }
}
