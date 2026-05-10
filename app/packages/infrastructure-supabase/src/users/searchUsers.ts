// Substring search on display_name OR share_handle. Extracted from
// SupabaseUserRepository so the parent file stays under cap. Used by the
// closure flow's "pick from any user" mode (FR-CLOSURE-003 extension).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@kc/domain';
import type { Database } from '../database.types';
import { mapUserRow, type UserRow } from './mapUserRow';

export async function searchUsers(
  client: SupabaseClient<Database>,
  query: string,
  opts: { excludeUserId: string; limit: number },
): Promise<User[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Escape ILIKE wildcards so a user typing "%" or "_" doesn't get a match-all.
  const escaped = q.replace(/[%_\\]/g, (c) => `\\${c}`);
  const { data, error } = await client
    .from('users')
    .select('*')
    .or(`display_name.ilike.%${escaped}%,share_handle.ilike.%${escaped}%`)
    .neq('user_id', opts.excludeUserId)
    .limit(Math.min(50, Math.max(1, opts.limit)));
  if (error) throw new Error(`searchUsers: ${error.message}`);

  const blockedIds = await fetchBlockedIdsSafe(client, opts.excludeUserId);
  return ((data ?? []) as unknown as UserRow[])
    .filter((u) => !blockedIds.has(u.user_id))
    .map(mapUserRow);
}

async function fetchBlockedIdsSafe(
  client: SupabaseClient<Database>,
  blockerId: string,
): Promise<Set<string>> {
  try {
    const { data, error } = await client
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', blockerId);
    if (error) return new Set();
    return new Set(((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id));
  } catch {
    return new Set();
  }
}
