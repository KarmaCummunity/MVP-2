/**
 * GetActivePostsCountUseCase — reads `community_stats` for the open-public count.
 * Mapped to FR-FEED-014 (active-community counter), FR-STATS-004.
 *
 * Negative counts are treated as zero (view query failures should never bubble
 * a misleading negative number into the UI).
 */

import type { IStatsRepository } from '../ports/IStatsRepository';

export class GetActivePostsCountUseCase {
  constructor(private readonly stats: IStatsRepository) {}

  async execute(): Promise<number> {
    const count = await this.stats.getActivePublicPostsCount();
    return Math.max(0, Math.trunc(count));
  }
}
