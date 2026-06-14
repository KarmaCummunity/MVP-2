// FR-BO-100 — Supabase adapter for `finance_accounts`.
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IFinanceAccountsRepository,
  FinanceAccountListFilters,
  FinanceAccountUpsertInput,
} from '@kc/application';
import {
  FinanceAccountError,
  parseFinanceAccountType,
  type FinanceAccount,
} from '@kc/domain';

interface FinanceAccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toError(err: { message?: string; code?: string } | null): FinanceAccountError {
  const msg = err?.message ?? '';
  if (msg === 'invalid_type') return new FinanceAccountError('invalid_type');
  if (msg === 'missing_required_fields') return new FinanceAccountError('missing_required_fields');
  if (msg === 'account_not_found' || err?.code === 'P0002') {
    return new FinanceAccountError('account_not_found');
  }
  if (err?.code === '23505') return new FinanceAccountError('duplicate_code');
  if (err?.code === '42501') return new FinanceAccountError('forbidden');
  return new FinanceAccountError('unknown', msg);
}

function mapRow(row: FinanceAccountRow): FinanceAccount | null {
  const type = parseFinanceAccountType(row.type);
  if (type === null) return null;
  return {
    id:        row.id,
    code:      row.code,
    name:      row.name,
    type,
    parentId:  row.parent_id,
    isActive:  row.is_active === true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseFinanceAccountsRepository implements IFinanceAccountsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: FinanceAccountListFilters): Promise<readonly FinanceAccount[]> {
    const { data, error } = await this.client.rpc('finance_account_list', {
      p_type: filters.type ?? null,
      p_active_only: filters.activeOnly ?? true,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as FinanceAccountRow[]) : [];
    const rows: FinanceAccount[] = [];
    for (const r of raw) {
      const m = mapRow(r);
      if (m !== null) rows.push(m);
    }
    return rows;
  }

  async upsert(input: FinanceAccountUpsertInput): Promise<string> {
    const { data, error } = await this.client.rpc('finance_account_upsert', {
      p_id: input.id ?? null,
      p_code: input.code,
      p_name: input.name,
      p_type: input.type,
      p_parent_id: input.parentId ?? null,
      p_is_active: input.isActive ?? true,
    });
    if (error) throw toError(error);
    return data as string;
  }
}
