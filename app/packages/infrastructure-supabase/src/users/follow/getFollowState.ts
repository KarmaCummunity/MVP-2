// app/packages/infrastructure-supabase/src/users/follow/getFollowState.ts
// Single-round-trip probe for FR-FOLLOW-011 state derivation. Runs five
// targeted queries in parallel; each query reads at most a single row.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowStateRaw } from '@kc/application';

export async function fetchFollowStateRaw(
  client: SupabaseClient,
  viewerId: string,
  targetUserId: string,
): Promise<FollowStateRaw> {
  const [targetRes, edgeRes, pendingRes, cooldownRes, blockRes] = await Promise.all([
    client
      .from('users')
      .select('user_id, privacy_mode, account_status')
      .eq('user_id', targetUserId)
      .maybeSingle(),
    client
      .from('follow_edges')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('followed_id', targetUserId)
      .maybeSingle(),
    client
      .from('follow_requests')
      .select('requester_id')
      .eq('requester_id', viewerId)
      .eq('target_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    client
      .from('follow_requests')
      .select('cooldown_until')
      .eq('requester_id', viewerId)
      .eq('target_id', targetUserId)
      .eq('status', 'rejected')
      .gt('cooldown_until', new Date().toISOString())
      .order('cooldown_until', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client.rpc('is_blocked', { a: viewerId, b: targetUserId }),
  ]);

  return {
    target: targetRes.data
      ? {
          userId: (targetRes.data as { user_id: string }).user_id,
          privacyMode: (targetRes.data as { privacy_mode: 'Public' | 'Private' }).privacy_mode,
          accountStatus: (targetRes.data as { account_status: 'active' | 'suspended' | 'deleted' })
            .account_status,
        }
      : null,
    followingExists: edgeRes.data !== null,
    pendingRequestExists: pendingRes.data !== null,
    cooldownUntil:
      (cooldownRes.data as { cooldown_until: string | null } | null)?.cooldown_until ?? null,
    blocked: Boolean(blockRes.data),
  };
}
