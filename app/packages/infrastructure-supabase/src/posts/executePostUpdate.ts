// FR-POST-008 — post row + media_assets replace (keeps SupabasePostRepository small, TD-50).
import type { SupabaseClient } from '@supabase/supabase-js';
import { PostError } from '@kc/application';
import type { UpdatePostInput } from '@kc/application';
import type { Post } from '@kc/domain';
import type { Database } from '../database.types';

function mapUpdateError(error: { message?: string }): never {
  if (error.message?.includes('visibility_downgrade_forbidden')) {
    throw new PostError('visibility_downgrade_forbidden', error.message);
  }
  throw new Error(`update: ${error.message}`);
}

export async function executePostUpdate(
  client: SupabaseClient<Database>,
  postId: string,
  patch: UpdatePostInput,
  fetchPostById: (pid: string) => Promise<Post | null>,
): Promise<Post> {
  const updateRow: Database['public']['Tables']['posts']['Update'] = {};
  if (patch.title !== undefined) updateRow.title = patch.title;
  if (patch.description !== undefined) updateRow.description = patch.description;
  if (patch.category !== undefined) updateRow.category = patch.category;
  if (patch.locationDisplayLevel !== undefined)
    updateRow.location_display_level = patch.locationDisplayLevel;
  if (patch.itemCondition !== undefined) updateRow.item_condition = patch.itemCondition;
  if (patch.urgency !== undefined) updateRow.urgency = patch.urgency;
  if (patch.visibility !== undefined) updateRow.visibility = patch.visibility;
  if (patch.address) {
    updateRow.city = patch.address.city;
    updateRow.street = patch.address.street;
    updateRow.street_number = patch.address.streetNumber;
  }

  const hasMediaPatch = patch.mediaAssets !== undefined;

  if (Object.keys(updateRow).length === 0 && !hasMediaPatch) {
    const current = await fetchPostById(postId);
    if (!current) throw new Error(`update: post ${postId} not found`);
    return current;
  }

  if (Object.keys(updateRow).length > 0) {
    const { error } = await client.from('posts').update(updateRow).eq('post_id', postId);
    if (error) mapUpdateError(error);
  } else if (hasMediaPatch) {
    const current = await fetchPostById(postId);
    if (!current) throw new Error(`update: post ${postId} not found`);
    const { error } = await client.from('posts').update({ title: current.title }).eq('post_id', postId);
    if (error) mapUpdateError(error);
  }

  if (hasMediaPatch) {
    const assets = patch.mediaAssets ?? [];
    const { error: delErr } = await client.from('media_assets').delete().eq('post_id', postId);
    if (delErr) throw new Error(`update.media_delete: ${delErr.message}`);
    if (assets.length > 0) {
      const mediaRows = assets.map((m, i) => ({
        post_id: postId,
        ordinal: i,
        path: m.path,
        mime_type: m.mimeType,
        size_bytes: m.sizeBytes,
      }));
      const { error: insErr } = await client.from('media_assets').insert(mediaRows);
      if (insErr) throw new Error(`update.media_insert: ${insErr.message}`);
    }
  }

  const updated = await fetchPostById(postId);
  if (!updated) throw new Error(`update: post ${postId} not found after update`);
  return updated;
}
