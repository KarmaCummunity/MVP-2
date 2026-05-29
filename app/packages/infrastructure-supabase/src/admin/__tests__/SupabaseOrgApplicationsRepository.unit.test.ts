import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isOrgApplicationError } from '@kc/domain';
import { SupabaseOrgApplicationsRepository } from '../SupabaseOrgApplicationsRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

const validRow = {
  application_id:    'app1',
  applicant_user_id: 'u1',
  applicant_name:    'Applicant',
  org_name:          'Org',
  org_description:   null,
  contact_email:     'org@example.com',
  contact_phone:     null,
  website_url:       null,
  status:            'pending',
  created_at:        '2026-01-01T00:00:00.000Z',
  reviewed_at:       null,
  reviewed_by:       null,
  reviewer_name:     null,
  review_note:       null,
  total_count:       1,
};

describe('SupabaseOrgApplicationsRepository — list', () => {
  it('maps rows and forwards filters', async () => {
    const spy = vi.fn(() => ({ data: [validRow], error: null }));
    const repo = new SupabaseOrgApplicationsRepository(mockClient(spy as never));
    const page = await repo.list({ status: 'pending', limit: 10, offset: 5 });
    expect(spy).toHaveBeenCalledWith('admin_org_application_list', {
      p_status: 'pending',
      p_limit:  10,
      p_offset: 5,
    });
    expect(page.totalCount).toBe(1);
    expect(page.rows[0]?.applicationId).toBe('app1');
    expect(page.rows[0]?.createdAt).toBeInstanceOf(Date);
  });

  it('drops rows with an unparseable status', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: [{ ...validRow, status: 'limbo' }], error: null })),
    );
    const page = await repo.list({});
    expect(page.rows).toEqual([]);
  });

  it('returns an empty page when data is not an array', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    expect(await repo.list({})).toEqual({ rows: [], totalCount: 0 });
  });

  it('parses string total_count', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: [{ ...validRow, total_count: '42' }], error: null })),
    );
    const page = await repo.list({});
    expect(page.totalCount).toBe(42);
  });

  it('maps SQLSTATE 42501 to forbidden', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { code: '42501', message: 'denied' } })),
    );
    await expect(repo.list({})).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'forbidden',
    );
  });

  it('maps invalid_status to its domain error', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_status' } })),
    );
    await expect(repo.list({ status: 'pending' })).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'invalid_status',
    );
  });
});

describe('SupabaseOrgApplicationsRepository — approve / reject', () => {
  it('approve forwards id + note', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseOrgApplicationsRepository(mockClient(spy as never));
    await repo.approve('a1', 'ok');
    expect(spy).toHaveBeenCalledWith('admin_org_application_approve', {
      p_application_id: 'a1',
      p_note: 'ok',
    });
  });

  it('approve maps application_not_found from message', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { message: 'application_not_found' } })),
    );
    await expect(repo.approve('missing')).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'application_not_found',
    );
  });

  it('approve maps application_already_decided', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { message: 'application_already_decided' } })),
    );
    await expect(repo.approve('a1')).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'application_already_decided',
    );
  });

  it('reject forwards id and defaults note to null', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseOrgApplicationsRepository(mockClient(spy as never));
    await repo.reject('a2');
    expect(spy).toHaveBeenCalledWith('admin_org_application_reject', {
      p_application_id: 'a2',
      p_note: null,
    });
  });

  it('reject maps P0002 code to application_not_found', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { code: 'P0002', message: 'no row' } })),
    );
    await expect(repo.reject('missing')).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'application_not_found',
    );
  });

  it('falls back to unknown for unmapped errors', async () => {
    const repo = new SupabaseOrgApplicationsRepository(
      mockClient(() => ({ data: null, error: { message: 'boom' } })),
    );
    await expect(repo.reject('a3')).rejects.toSatisfy((e) =>
      isOrgApplicationError(e) && e.code === 'unknown',
    );
  });
});
