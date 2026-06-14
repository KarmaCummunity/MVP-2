import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isOrganizationError } from '@kc/domain';
import { SupabaseOrganizationRepository } from '../SupabaseOrganizationRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

const validRow = {
  id: 'o1',
  slug: 'karma-community',
  display_name: 'קהילת קארמה',
  legal_name: 'Karma Community',
  status: 'active',
  is_default: true,
  logo_url: null,
  primary_color: null,
  accent_color: null,
  currency: 'ILS',
  locale: 'he',
};

describe('SupabaseOrganizationRepository — listMine', () => {
  it('calls get_my_organizations and maps rows', async () => {
    const spy = vi.fn(() => ({ data: [validRow], error: null }));
    const repo = new SupabaseOrganizationRepository(mockClient(spy as never));
    const rows = await repo.listMine();
    expect(spy).toHaveBeenCalledWith('get_my_organizations');
    expect(rows[0]?.id).toBe('o1');
    expect(rows[0]?.isDefault).toBe(true);
    expect(rows[0]?.currency).toBe('ILS');
  });

  it('drops rows with an unparseable status', async () => {
    const repo = new SupabaseOrganizationRepository(
      mockClient(() => ({ data: [{ ...validRow, status: 'limbo' }], error: null })),
    );
    expect(await repo.listMine()).toEqual([]);
  });

  it('defaults currency/locale when null', async () => {
    const repo = new SupabaseOrganizationRepository(
      mockClient(() => ({ data: [{ ...validRow, currency: null, locale: null }], error: null })),
    );
    const rows = await repo.listMine();
    expect(rows[0]?.currency).toBe('ILS');
    expect(rows[0]?.locale).toBe('he');
  });

  it('returns an empty list when data is null', async () => {
    const repo = new SupabaseOrganizationRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    expect(await repo.listMine()).toEqual([]);
  });

  it('maps a forbidden RPC error to OrganizationError', async () => {
    const repo = new SupabaseOrganizationRepository(
      mockClient(() => ({ data: null, error: { code: '42501', message: 'denied' } })),
    );
    await expect(repo.listMine()).rejects.toSatisfy(isOrganizationError);
  });
});
