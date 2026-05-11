/**
 * ListMyActivityTimelineUseCase — FR-STATS-003 (personal activity feed).
 */

import type { PersonalActivityItem } from '@kc/domain';
import type { IStatsRepository } from '../ports/IStatsRepository';

const MAX = 50;

export class ListMyActivityTimelineUseCase {
  constructor(private readonly stats: IStatsRepository) {}

  async execute(limit = 30): Promise<PersonalActivityItem[]> {
    const safe = Math.min(MAX, Math.max(1, Math.trunc(limit)));
    return this.stats.listMyActivityTimeline(safe);
  }
}
