/**
 * GetCommunityStatsSnapshotUseCase — reads `community_stats` (FR-STATS-004).
 */

import type { CommunityStatsSnapshot, IStatsRepository } from '../ports/IStatsRepository';

function clampNonNegInt(n: number): number {
  return Math.max(0, Math.trunc(Number.isFinite(n) ? n : 0));
}

export class GetCommunityStatsSnapshotUseCase {
  constructor(private readonly stats: IStatsRepository) {}

  async execute(): Promise<CommunityStatsSnapshot> {
    const s = await this.stats.getCommunityStatsSnapshot();
    return {
      registeredUsers: clampNonNegInt(s.registeredUsers),
      activePublicPosts: clampNonNegInt(s.activePublicPosts),
      itemsDeliveredTotal: clampNonNegInt(s.itemsDeliveredTotal),
      asOf: s.asOf,
    };
  }
}
