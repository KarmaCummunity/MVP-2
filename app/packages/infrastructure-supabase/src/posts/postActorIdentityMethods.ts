import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostActorIdentityRow, UpsertPostActorIdentityInput } from '@kc/application';
import type { PostVisibility } from '@kc/domain';
import type { Database } from '../database.types';
import { isPostgrestRelationMissing } from '../lib/postgrestRelationMissing';

function parsePostVisibility(raw: string | null | undefined): PostVisibility {
  if (raw === 'Public' || raw === 'FollowersOnly' || raw === 'OnlyMe') return raw;
  return 'Public';
}

export async function listPostActorIdentitiesForPost(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<PostActorIdentityRow[]> {
  const { data, error } = await client.from('post_actor_identity').select('post_id, user_id, identity_visibility, hide_from_counterparty, surface_visibility, updated_at').eq('post_id', postId);
  if (error) {
    if (isPostgrestRelationMissing(error)) return [];
    throw new Error(`listPostActorIdentities: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    postId: row.post_id,
    userId: row.user_id,
    surfaceVisibility: parsePostVisibility(
      (row as { surface_visibility?: string }).surface_visibility ?? 'Public',
    ),
    hideFromCounterparty: row.hide_from_counterparty,
  }));
}

export async function upsertPostActorIdentityRow(
  client: SupabaseClient<Database>,
  input: UpsertPostActorIdentityInput,
): Promise<void> {
  // updated_at is stamped server-side: INSERT path uses the column default;
  // UPDATE path is set by the post_actor_identity_set_updated_at trigger
  // (migration 0152, TD-85). The column was dropped from the client UPDATE
  // grant in the same migration, so sending it from here would fail.
  const { error } = await client.from('post_actor_identity').upsert(
    {
      post_id: input.postId,
      user_id: input.userId,
      surface_visibility: input.surfaceVisibility,
      identity_visibility: 'Public',
      hide_from_counterparty: input.hideFromCounterparty,
    },
    { onConflict: 'post_id,user_id' },
  );
  if (error) {
    if (isPostgrestRelationMissing(error)) return;
    throw new Error(`upsertPostActorIdentity: ${error.message}`);
  }
}
