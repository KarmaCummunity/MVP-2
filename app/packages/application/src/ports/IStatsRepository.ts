// IStatsRepository — port for community-wide stats reads (FR-FEED-014, FR-STATS-004).
//
// Adapter reads from the `community_stats` view created in migration 0006.
// The counter is refreshed by the caller (typically every 60s via TanStack
// Query's refetchInterval). Edge-cached endpoint per FR-FEED-014 AC3 is
// deferred to P2.x; for MVP a direct view read is sufficient.

export interface IStatsRepository {
  /**
   * Count of currently open, public-visibility posts across all of Israel.
   * Used by the guest banner and the warm empty state.
   */
  getActivePublicPostsCount(): Promise<number>;
}
