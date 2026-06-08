import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isCrmContactError } from '@kc/domain';
import { SupabaseCrmContactsRepository } from '../SupabaseCrmContactsRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

const validRow = {
  contact_id:        'c1',
  name:              'Alice',
  organization:      'Acme',
  email:             'a@example.com',
  phone:             null,
  role_title:        null,
  notes:             null,
  tags:              ['donor'],
  status:            'warm',
  last_contacted_at: null,
  created_at:        '2026-01-01T00:00:00.000Z',
  updated_at:        '2026-01-02T00:00:00.000Z',
  total_count:       1,
};

describe('SupabaseCrmContactsRepository — list', () => {
  it('maps rows and forwards filters', async () => {
    const spy = vi.fn(() => ({ data: [validRow], error: null }));
    const repo = new SupabaseCrmContactsRepository(mockClient(spy as never));
    const page = await repo.list({ status: 'warm', query: 'a', tag: 'donor', limit: 10, offset: 0 });
    expect(spy).toHaveBeenCalledWith('crm_contact_list', {
      p_status: 'warm', p_query: 'a', p_tag: 'donor', p_limit: 10, p_offset: 0,
    });
    expect(page.totalCount).toBe(1);
    expect(page.rows[0]?.contactId).toBe('c1');
    expect(page.rows[0]?.tags).toEqual(['donor']);
  });

  it('drops rows with an unparseable status', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: [{ ...validRow, status: 'limbo' }], error: null })),
    );
    expect((await repo.list({})).rows).toEqual([]);
  });

  it('parses string total_count', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: [{ ...validRow, total_count: '12' }], error: null })),
    );
    expect((await repo.list({})).totalCount).toBe(12);
  });

  it('returns empty page when data is null', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    expect(await repo.list({})).toEqual({ rows: [], totalCount: 0 });
  });

  it('maps SQLSTATE 42501 to forbidden', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: { code: '42501', message: 'denied' } })),
    );
    await expect(repo.list({})).rejects.toSatisfy((e) =>
      isCrmContactError(e) && e.code === 'forbidden',
    );
  });
});

describe('SupabaseCrmContactsRepository — upsert / delete / markContacted', () => {
  it('upsert forwards args and returns the new id', async () => {
    const spy = vi.fn(() => ({ data: 'new-id', error: null }));
    const repo = new SupabaseCrmContactsRepository(mockClient(spy as never));
    const id = await repo.upsert({ name: 'Bob' } as never);
    expect(spy).toHaveBeenCalledWith('crm_contact_upsert', expect.objectContaining({
      p_contact_id: null,
      p_name: 'Bob',
    }));
    expect(id).toBe('new-id');
  });

  it('upsert maps invalid_name', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_name' } })),
    );
    await expect(repo.upsert({ name: '' } as never)).rejects.toSatisfy((e) =>
      isCrmContactError(e) && e.code === 'invalid_name',
    );
  });

  it('upsert throws unknown when data is not a string', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    await expect(repo.upsert({ name: 'X' } as never)).rejects.toSatisfy((e) =>
      isCrmContactError(e) && e.code === 'unknown',
    );
  });

  it('delete forwards the id', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseCrmContactsRepository(mockClient(spy as never));
    await repo.delete('c1');
    expect(spy).toHaveBeenCalledWith('crm_contact_delete', { p_contact_id: 'c1' });
  });

  it('delete maps P0002 to contact_not_found', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: { code: 'P0002', message: 'gone' } })),
    );
    await expect(repo.delete('missing')).rejects.toSatisfy((e) =>
      isCrmContactError(e) && e.code === 'contact_not_found',
    );
  });

  it('markContacted forwards the id', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseCrmContactsRepository(mockClient(spy as never));
    await repo.markContacted('c2');
    expect(spy).toHaveBeenCalledWith('crm_contact_mark_contacted', { p_contact_id: 'c2' });
  });

  it('markContacted maps invalid_status', async () => {
    const repo = new SupabaseCrmContactsRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_status' } })),
    );
    await expect(repo.markContacted('c2')).rejects.toSatisfy((e) =>
      isCrmContactError(e) && e.code === 'invalid_status',
    );
  });
});
