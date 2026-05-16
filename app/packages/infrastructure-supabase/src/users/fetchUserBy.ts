// Shared helper: SELECT * FROM users WHERE <col> = <value>, mapped to domain.
// Extracted from SupabaseUserRepository to keep that file under the size cap
// (TD-112). See TD-39 for the non-self scrub rationale.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@kc/domain';
import { mapUserRow, type UserRow } from './mapUserRow';

/**
 * TD-39: when the viewer is NOT the row's owner, blank out the internal
 * counter columns that would otherwise let a non-owner infer OnlyMe post
 * existence via `active_posts_count_internal − visible_count`. The DB
 * column-grants still return the raw numbers (RLS predicates apply per row,
 * not per column), so the privacy boundary is enforced here at the adapter.
 *
 * `auth.getSession()` reads the cached JWT — no network roundtrip.
 */
export async function fetchUserBy(
  client: SupabaseClient,
  column: 'user_id' | 'share_handle',
  value: string,
): Promise<User | null> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq(column, value)
    .maybeSingle();
  if (error) throw new Error(`fetchUserBy(${column}): ${error.message}`);
  if (!data) return null;

  const user = mapUserRow(data as unknown as UserRow);

  const { data: sessionData } = await client.auth.getSession();
  const viewerId = sessionData.session?.user.id ?? null;
  if (viewerId === user.userId) return user;

  // Closure-side counters (items_given_count / items_received_count) stay
  // visible — they're lifetime totals over closed_delivered posts and don't
  // leak OnlyMe presence.
  return { ...user, activePostsCountInternal: 0 };
}
