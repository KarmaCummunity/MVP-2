import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountGateResult, IAccountGateRepository } from '@kc/application';
import { InfrastructureError } from '@kc/application';
import type { Database } from '../database.types';

/**
 * FR-MOD-010 — thin wrapper over the `auth_check_account_gate` RPC. Returns
 * `{ allowed: true }` when the user may proceed, otherwise the rejection
 * reason and (optional) until-timestamp surfaced by the RPC.
 */
export class SupabaseAccountGateRepository implements IAccountGateRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async checkAccountGate(userId: string): Promise<AccountGateResult> {
    const { data, error } = await this.client.rpc('auth_check_account_gate', {
      p_user_id: userId,
    });
    if (error) {
      throw new InfrastructureError(
        `auth_check_account_gate failed: ${error.message}`,
        error,
      );
    }
    const rows = (data ?? []) as Array<{
      allowed: boolean;
      reason: string | null;
      until_at: string | null;
    }>;
    const row = rows[0];
    if (!row || row.allowed) return { allowed: true };
    return {
      allowed: false,
      reason: row.reason as AccountGateResult['reason'],
      until: row.until_at ?? undefined,
    };
  }
}
