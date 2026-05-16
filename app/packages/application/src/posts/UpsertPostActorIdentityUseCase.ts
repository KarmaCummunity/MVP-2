import type { IPostRepository } from '../ports/IPostRepository';
import type { UpsertPostActorIdentityInput } from '../ports/postActorIdentity';

/** FR-POST-021 — upsert the caller's row in `post_actor_identity`. */
export class UpsertPostActorIdentityUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: UpsertPostActorIdentityInput): Promise<void> {
    await this.repo.upsertPostActorIdentity(input);
  }
}
