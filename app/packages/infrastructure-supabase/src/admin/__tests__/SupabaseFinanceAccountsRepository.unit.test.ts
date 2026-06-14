import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isFinanceAccountError } from '@kc/domain';
import { SupabaseFinanceAccountsRepository } from '../SupabaseFinanceAccountsRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

const validRow = {
  id: 'a1',
  code: '4000',
  name: 'תרומות',
  type: 'income',
  parent_id: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

describe('SupabaseFinanceAccountsRepository — list', () => {
  it('forwards filters and maps rows', async () => {
    const spy = vi.fn(() => ({ data: [validRow], error: null }));
    const repo = new SupabaseFinanceAccountsRepository(mockClient(spy as never));
    const rows = await repo.list({ type: 'income', activeOnly: false });
    expect(spy).toHaveBeenCalledWith('finance_account_list', { p_type: 'income', p_active_only: false });
    expect(rows[0]?.id).toBe('a1');
    expect(rows[0]?.type).toBe('income');
  });

  it('defaults activeOnly to true and type to null', async () => {
    const spy = vi.fn(() => ({ data: [], error: null }));
    const repo = new SupabaseFinanceAccountsRepository(mockClient(spy as never));
    await repo.list({});
    expect(spy).toHaveBeenCalledWith('finance_account_list', { p_type: null, p_active_only: true });
  });

  it('drops rows with an unparseable type', async () => {
    const repo = new SupabaseFinanceAccountsRepository(
      mockClient(() => ({ data: [{ ...validRow, type: 'revenue' }], error: null })),
    );
    expect(await repo.list({})).toEqual([]);
  });

  it('maps a duplicate-code error', async () => {
    const repo = new SupabaseFinanceAccountsRepository(
      mockClient(() => ({ data: null, error: { code: '23505', message: 'dup' } })),
    );
    await expect(repo.list({})).rejects.toSatisfy(isFinanceAccountError);
  });
});

describe('SupabaseFinanceAccountsRepository — upsert', () => {
  it('passes all params and returns the new id', async () => {
    const spy = vi.fn(() => ({ data: 'new-id', error: null }));
    const repo = new SupabaseFinanceAccountsRepository(mockClient(spy as never));
    const id = await repo.upsert({ code: '5000', name: 'שכר', type: 'expense' });
    expect(spy).toHaveBeenCalledWith('finance_account_upsert', {
      p_id: null, p_code: '5000', p_name: 'שכר', p_type: 'expense',
      p_parent_id: null, p_is_active: true,
    });
    expect(id).toBe('new-id');
  });

  it('maps account_not_found on update of a missing row', async () => {
    const repo = new SupabaseFinanceAccountsRepository(
      mockClient(() => ({ data: null, error: { code: 'P0002', message: 'account_not_found' } })),
    );
    await expect(repo.upsert({ id: 'x', code: '1', name: 'n', type: 'asset' }))
      .rejects.toSatisfy(isFinanceAccountError);
  });
});
