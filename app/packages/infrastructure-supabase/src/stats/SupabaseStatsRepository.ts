// SupabaseStatsRepository — adapter for IStatsRepository.
// Mapped to SRS: FR-FEED-014, FR-STATS-003, FR-STATS-004.
//
// Reads from `community_stats` (0006) and `rpc_my_activity_timeline` (0030).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityStatsSnapshot, IStatsRepository } from '@kc/application';
import type { PersonalActivityItem, PersonalActivityKind } from '@kc/domain';
import type { Database } from '../database.types';

const ACTIVITY_KINDS = new Set<string>([
  'post_created',
  'post_closed_delivered',
  'post_closed_no_recipient',
  'post_reopened',
  'marked_as_recipient',
  'unmarked_as_recipient',
  'post_expired',
  'post_removed_admin',
]);

type ActivityRpcRow = {
  occurred_at: string;
  kind: string;
  post_id: string;
  post_title: string;
  actor_display_name: string | null;
};

function mapActivityKind(kind: string): PersonalActivityKind {
  if (ACTIVITY_KINDS.has(kind)) return kind as PersonalActivityKind;
  return 'post_created';
}

function mapSnapshotRow(data: {
  registered_users?: number | null;
  active_public_posts?: number | null;
  items_delivered_total?: number | null;
  as_of?: string | null;
} | null): CommunityStatsSnapshot {
  return {
    registeredUsers: Number(data?.registered_users ?? 0),
    activePublicPosts: Number(data?.active_public_posts ?? 0),
    itemsDeliveredTotal: Number(data?.items_delivered_total ?? 0),
    asOf: data?.as_of ?? null,
  };
}

export class SupabaseStatsRepository implements IStatsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getCommunityStatsSnapshot(): Promise<CommunityStatsSnapshot> {
    const { data, error } = await this.client
      .from('community_stats')
      .select('registered_users, active_public_posts, items_delivered_total, as_of')
      .maybeSingle();

    if (error) throw new Error(`getCommunityStatsSnapshot: ${error.message}`);
    return mapSnapshotRow(data);
  }

  async getActivePublicPostsCount(): Promise<number> {
    const s = await this.getCommunityStatsSnapshot();
    return s.activePublicPosts;
  }

  async listMyActivityTimeline(limit: number): Promise<PersonalActivityItem[]> {
    const { data, error } = await this.client.rpc('rpc_my_activity_timeline', {
      p_limit: limit,
    });

    if (error) throw new Error(`listMyActivityTimeline: ${error.message}`);
    const rows = (data ?? []) as ActivityRpcRow[];
    return rows.map((r) => ({
      occurredAt: r.occurred_at,
      kind: mapActivityKind(r.kind),
      postId: r.post_id,
      postTitle: r.post_title,
      actorDisplayName: r.actor_display_name,
    }));
  }
}
