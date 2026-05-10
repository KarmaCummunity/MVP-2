// app/packages/infrastructure-supabase/src/users/follow/followRequestMethods.ts
// Concrete implementations of the IUserRepository follow-request methods.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowRequest, FollowRequestStatus } from '@kc/domain';
import type { FollowRequestWithUser, PaginatedRequests } from '@kc/application';
import { mapUserRow, type UserRow } from '../mapUserRow';
import { mapFollowError } from './mapFollowError';

interface FollowRequestRow {
  requester_id: string;
  target_id: string;
  status: FollowRequestStatus;
  created_at: string;
  cooldown_until: string | null;
}

function rowToRequest(r: FollowRequestRow): FollowRequest {
  return {
    requesterId: r.requester_id,
    targetId: r.target_id,
    status: r.status,
    createdAt: r.created_at,
    cooldownUntil: r.cooldown_until,
  };
}

export async function sendRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<FollowRequest> {
  const { data, error } = await client
    .from('follow_requests')
    .insert({ requester_id: requesterId, target_id: targetId, status: 'pending' })
    .select('requester_id, target_id, status, created_at, cooldown_until')
    .single();
  if (error) throw mapFollowError(error);
  return rowToRequest(data as FollowRequestRow);
}

export async function cancelRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'cancelled' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function acceptRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function rejectRequest(
  client: SupabaseClient,
  requesterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_requests')
    .update({ status: 'rejected' })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  if (error) throw mapFollowError(error);
}

export async function listPendingRaw(
  client: SupabaseClient,
  targetId: string,
): Promise<FollowRequest[]> {
  const { data, error } = await client
    .from('follow_requests')
    .select('requester_id, target_id, status, created_at, cooldown_until')
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw mapFollowError(error);
  return ((data ?? []) as FollowRequestRow[]).map(rowToRequest);
}

export async function listPendingWithUsers(
  client: SupabaseClient,
  targetId: string,
  limit: number,
  cursor?: string,
): Promise<PaginatedRequests> {
  const base = client
    .from('follow_requests')
    .select(
      'requester_id, target_id, status, created_at, cooldown_until, requester:requester_id(*)',
    )
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);
  const { data, error } = await (cursor ? base.lt('created_at', cursor) : base);
  if (error) throw mapFollowError(error);

  const rows = (data ?? []) as unknown as (FollowRequestRow & { requester: UserRow | null })[];
  const requests: FollowRequestWithUser[] = rows
    .filter((r) => r.requester !== null)
    .map((r) => ({ request: rowToRequest(r), requester: mapUserRow(r.requester as UserRow) }));
  const last = rows[rows.length - 1];
  const nextCursor = requests.length === limit && last ? last.created_at : null;
  return { requests, nextCursor };
}
