import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post } from '@kc/domain';
import type { Database } from '../database.types';
import { POST_SELECT_BARE, mapPostRow, type PostJoinedRow } from './mapPostRow';

export async function fetchPostById(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<Post | null> {
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT_BARE)
    .eq('post_id', postId)
    .maybeSingle();
  if (error) throw new Error(`fetchPostById: ${error.message}`);
  if (!data) return null;
  return mapPostRow(data as unknown as PostJoinedRow);
}

export async function countOpenByUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count, error } = await client
    .from('posts')
    .select('post_id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('status', 'open');
  if (error) throw new Error(`countOpenByUser: ${error.message}`);
  return count ?? 0;
}
