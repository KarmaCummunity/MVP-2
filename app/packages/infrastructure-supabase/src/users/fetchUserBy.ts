// Shared helper: SELECT public columns FROM users WHERE <col> = <value>, mapped to domain.
// Extracted from SupabaseUserRepository to keep that file under the size cap
// (TD-112). See TD-39 / TD-163 for non-self scrub and column grants.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@kc/domain';
import { mapUserRow, type UserRow } from './mapUserRow';
import { scrubUserForNonOwner } from './scrubUserForViewer';
import { USER_PUBLIC_SELECT_COLUMNS } from './userPublicColumns';
import {
  fetchUsersSelfPrivateFields,
  mergeSelfPrivateFields,
} from './usersSelfPrivateFields';

/**
 * TD-39: when the viewer is NOT the row's owner, blank out the internal
 * counter columns that would otherwise let a non-owner infer OnlyMe post
 * existence via counter deltas (internal excludes OnlyMe; public projection does not).
 *
 * TD-163: PII columns are revoked at the DB grant layer; the adapter also
 * scrubs any residual fields for non-owners. Owners merge private fields via RPC.
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
    .select(USER_PUBLIC_SELECT_COLUMNS)
    .eq(column, value)
    .maybeSingle();
  if (error) throw new Error(`fetchUserBy(${column}): ${error.message}`);
  if (!data) return null;

  let user = mapUserRow(data as unknown as UserRow);

  const { data: sessionData } = await client.auth.getSession();
  const viewerId = sessionData.session?.user.id ?? null;
  if (viewerId === user.userId) {
    const slice = await fetchUsersSelfPrivateFields(client);
    if (slice) user = mergeSelfPrivateFields(user, slice);
    return user;
  }

  return scrubUserForNonOwner(user);
}
