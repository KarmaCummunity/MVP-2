// IStatsRepository — port for community-wide stats reads (FR-FEED-014, FR-STATS-004)
// and personal activity timeline (FR-STATS-003).
//
// Adapter reads from the `community_stats` view created in migration 0006.
// Community numbers are always fresh at read time; FR-STATS-004 AC2 expects
// ~60s client-side refresh (TanStack Query refetchInterval).
//
// Activity timeline is served by `rpc_my_activity_timeline` (migration 0030).

import type { PersonalActivityItem } from '@kc/domain';

export interface CommunityStatsSnapshot {
  readonly registeredUsers: number;
  readonly activePublicPosts: number;
  readonly itemsDeliveredTotal: number;
  /** Server clock at read time (ISO), when the view exposes it. */
  readonly asOf: string | null;
}

export interface IStatsRepository {
  /**
   * Count of currently open, public-visibility posts across all of Israel.
   * Used by the guest banner and the warm empty state.
   */
  getActivePublicPostsCount(): Promise<number>;

  /** Full community_stats row (FR-STATS-004 AC1). */
  getCommunityStatsSnapshot(): Promise<CommunityStatsSnapshot>;

  /** Personal activity for the signed-in user (FR-STATS-003). */
  listMyActivityTimeline(limit: number): Promise<PersonalActivityItem[]>;
}
