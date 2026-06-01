// FR-POST-021 — persist owner actor-identity row after edit (mirrors create publish).
import type { PostVisibility } from '@kc/domain';
import {
  getListPostActorIdentityUseCase,
  getUpsertPostActorIdentityUseCase,
} from '../services/postsComposition';

export async function syncOwnerPostActorIdentity(input: {
  postId: string;
  ownerId: string;
  visibility: PostVisibility;
  hideFromCounterparty: boolean;
}): Promise<void> {
  const effectiveHide = input.hideFromCounterparty || input.visibility === 'OnlyMe';
  if (!effectiveHide) {
    const rows = await getListPostActorIdentityUseCase().execute({ postId: input.postId });
    const mine = rows.find((r) => r.userId === input.ownerId);
    if (!mine) return;
  }
  await getUpsertPostActorIdentityUseCase().execute({
    postId: input.postId,
    userId: input.ownerId,
    surfaceVisibility: input.visibility,
    hideFromCounterparty: effectiveHide,
  });
}
