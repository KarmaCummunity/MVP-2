import type { IPostRepository } from '../ports/IPostRepository';
import type { UpsertPostActorIdentityInput } from '../ports/postActorIdentity';
import { canUpgradeVisibility } from '@kc/domain';
import { PostError } from './errors';

/** FR-POST-021 — upsert the caller's row in `post_actor_identity` (surface audience + counterparty mask). */
export class UpsertPostActorIdentityUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: UpsertPostActorIdentityInput): Promise<void> {
    const rows = await this.repo.listPostActorIdentities(input.postId);
    const mine = rows.find((r) => r.userId === input.userId);
    const prevSurface = mine?.surfaceVisibility ?? 'Public';
    if (input.surfaceVisibility !== prevSurface) {
      if (!canUpgradeVisibility(prevSurface, input.surfaceVisibility)) {
        throw new PostError('visibility_downgrade_forbidden', 'surface_visibility_downgrade_forbidden');
      }
    }
    await this.repo.upsertPostActorIdentity(input);
  }
}
