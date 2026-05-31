import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isTimesheetError } from '@kc/domain';
import { SupabaseTimesheetsRepository } from '../SupabaseTimesheetsRepository';

function mockClient(rpcImpl: (name: string, args?: unknown) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl as never) } as unknown as SupabaseClient;
}

const validRow = {
  entry_id:     't1',
  user_id:      'u1',
  user_name:    'Alice',
  work_date:    '2026-01-15',
  hours_x100:   800,
  project:      'P-1',
  description:  null,
  status:       'submitted',
  submitted_at: '2026-01-15T17:00:00.000Z',
  approved_at:  null,
  approved_by:  null,
  approver_name: null,
  approval_note: null,
  created_at:   '2026-01-15T00:00:00.000Z',
  updated_at:   '2026-01-15T17:00:00.000Z',
  total_count:  1,
};

describe('SupabaseTimesheetsRepository — list', () => {
  it('maps a row and forwards filters', async () => {
    const spy = vi.fn(() => ({ data: [validRow], error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    const page = await repo.list({
      userId: 'u1', status: 'submitted', fromDate: '2026-01-01', toDate: '2026-01-31',
      limit: 10, offset: 5,
    });
    expect(spy).toHaveBeenCalledWith('timesheet_list', {
      p_user_id: 'u1',
      p_status:  'submitted',
      p_from:    '2026-01-01',
      p_to:      '2026-01-31',
      p_limit:   10,
      p_offset:  5,
    });
    expect(page.totalCount).toBe(1);
    expect(page.rows[0]?.workDate).toBe('2026-01-15');
    expect(page.rows[0]?.hoursX100).toBe(800);
    expect(page.rows[0]?.submittedAt).toBeInstanceOf(Date);
  });

  it('drops rows with an unparseable status', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: [{ ...validRow, status: 'limbo' }], error: null })),
    );
    expect((await repo.list({})).rows).toEqual([]);
  });

  it('parses string hours and total_count', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: [{ ...validRow, hours_x100: '900', total_count: '4' }], error: null })),
    );
    const page = await repo.list({});
    expect(page.rows[0]?.hoursX100).toBe(900);
    expect(page.totalCount).toBe(4);
  });

  it('returns empty page when data is not an array', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    expect(await repo.list({})).toEqual({ rows: [], totalCount: 0 });
  });

  it('maps SQLSTATE 42501 to forbidden', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: { code: '42501', message: 'denied' } })),
    );
    await expect(repo.list({})).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'forbidden',
    );
  });

  it('maps known error messages to domain codes', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_hours' } })),
    );
    await expect(repo.list({})).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'invalid_hours',
    );
  });
});

describe('SupabaseTimesheetsRepository — write/transition RPCs', () => {
  it('upsert returns the id and forwards args', async () => {
    const spy = vi.fn(() => ({ data: 'new-id', error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    const id = await repo.upsert({ workDate: '2026-01-15', hoursX100: 800 } as never);
    expect(id).toBe('new-id');
    expect(spy).toHaveBeenCalledWith('timesheet_upsert', expect.objectContaining({
      p_entry_id:   null,
      p_work_date:  '2026-01-15',
      p_hours_x100: 800,
    }));
  });

  it('upsert maps P0002 to entry_not_found', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: { code: 'P0002', message: 'gone' } })),
    );
    await expect(repo.upsert({ entryId: 'x' } as never)).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'entry_not_found',
    );
  });

  it('upsert throws unknown when data is not a string', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: null })),
    );
    await expect(repo.upsert({ workDate: '2026-01-15' } as never)).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'unknown',
    );
  });

  it('submit forwards the id', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    await repo.submit('t1');
    expect(spy).toHaveBeenCalledWith('timesheet_submit', { p_entry_id: 't1' });
  });

  it('approve forwards id and note', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    await repo.approve('t1', 'ok');
    expect(spy).toHaveBeenCalledWith('timesheet_approve', { p_entry_id: 't1', p_note: 'ok' });
  });

  it('reject defaults note to null', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    await repo.reject('t2');
    expect(spy).toHaveBeenCalledWith('timesheet_reject', { p_entry_id: 't2', p_note: null });
  });

  it('reject maps invalid_status', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: { message: 'invalid_status' } })),
    );
    await expect(repo.reject('t2')).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'invalid_status',
    );
  });

  it('delete forwards the id', async () => {
    const spy = vi.fn(() => ({ data: null, error: null }));
    const repo = new SupabaseTimesheetsRepository(mockClient(spy as never));
    await repo.delete('t3');
    expect(spy).toHaveBeenCalledWith('timesheet_delete', { p_entry_id: 't3' });
  });

  it('delete falls back to unknown for unmapped errors', async () => {
    const repo = new SupabaseTimesheetsRepository(
      mockClient(() => ({ data: null, error: { message: 'boom' } })),
    );
    await expect(repo.delete('t4')).rejects.toSatisfy((e) =>
      isTimesheetError(e) && e.code === 'unknown',
    );
  });
});
