import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostActorIdentityRow, UpsertPostActorIdentityInput } from '@kc/application';
import type { PostActorIdentityExposure } from '@kc/domain';
import type { Database } from '../database.types';
import { isPostgrestRelationMissing } from '../lib/postgrestRelationMissing';

function parseActorExposure(raw: string): PostActorIdentityExposure {
  if (raw === 'Public' || raw === 'FollowersOnly' || raw === 'Hidden') return raw;
  return 'Public';
}

export async function listPostActorIdentitiesForPost(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<PostActorIdentityRow[]> {
  const { data, error } = await client.from('post_actor_identity').select('*').eq('post_id', postId);
  if (error) {
    if (isPostgrestRelationMissing(error)) return [];
    throw new Error(`listPostActorIdentities: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    postId: row.post_id,
    userId: row.user_id,
    exposure: parseActorExposure(row.exposure),
    hideFromCounterparty: row.hide_from_counterparty,
  }));
}

export async function upsertPostActorIdentityRow(
  client: SupabaseClient<Database>,
  input: UpsertPostActorIdentityInput,
): Promise<void> {
  const { error } = await client.from('post_actor_identity').upsert(
    {
      post_id: input.postId,
      user_id: input.userId,
      exposure: input.exposure,
      hide_from_counterparty: input.hideFromCounterparty,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'post_id,user_id' },
  );
  if (error) {
    if (isPostgrestRelationMissing(error)) return;
    throw new Error(`upsertPostActorIdentity: ${error.message}`);
  }
}
