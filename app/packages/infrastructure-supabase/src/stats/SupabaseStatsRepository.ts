// SupabaseStatsRepository — adapter for IStatsRepository.
// Mapped to SRS: FR-FEED-014 (active-community counter), FR-STATS-004.
//
// Reads from the `community_stats` view created in migration 0006. The view
// is materialized server-side and updated by triggers; the read here is a
// single-row SELECT with no joins and stays under 5ms even at scale.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStatsRepository } from '@kc/application';
import type { Database } from '../database.types';

export class SupabaseStatsRepository implements IStatsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getActivePublicPostsCount(): Promise<number> {
    const { data, error } = await this.client
      .from('community_stats')
      .select('active_public_posts')
      .maybeSingle();

    if (error) throw new Error(`getActivePublicPostsCount: ${error.message}`);
    return Number(data?.active_public_posts ?? 0);
  }
}
