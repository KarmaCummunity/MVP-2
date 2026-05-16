import type { PostVisibility } from '@kc/domain';

/** FR-POST-021 — row from `public.post_actor_identity` (RLS-filtered). */
export interface PostActorIdentityRow {
  postId: string;
  userId: string;
  surfaceVisibility: PostVisibility;
  hideFromCounterparty: boolean;
}

export interface UpsertPostActorIdentityInput {
  postId: string;
  userId: string;
  surfaceVisibility: PostVisibility;
  hideFromCounterparty: boolean;
}
