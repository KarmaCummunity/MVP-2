import type { SupabaseClient } from '@supabase/supabase-js';
import type { IBlockRepository } from '@kc/application';
import { BlockError } from '@kc/application';
import type { Database } from '../database.types';

export class SupabaseBlockRepository implements IBlockRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async block(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await this.client
      .from('blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    // Idempotent insert: 23505 (unique_violation) means already blocked — fine.
    if (error && error.code !== '23505') {
      throw new BlockError('unknown', error.message, error);
    }
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await this.client
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) throw new BlockError('unknown', error.message, error);
  }

  async isBlockedByMe(viewerId: string, otherId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('blocks')
      .select('blocker_id')
      .eq('blocker_id', viewerId)
      .eq('blocked_id', otherId)
      .maybeSingle();
    if (error) throw new BlockError('unknown', error.message, error);
    return !!data;
  }
}
