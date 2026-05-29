// V2-ADMIN-TIME-10 — Supabase adapter for admin timesheets.
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ITimesheetsRepository, TimesheetListFilters, TimesheetUpsertInput,
} from '@kc/application';
import {
  TimesheetError, type TimesheetEntry, type TimesheetPage,
  parseTimesheetStatus,
} from '@kc/domain';

interface EntryRow {
  entry_id: string;
  user_id: string;
  user_name: string | null;
  work_date: string;
  hours_x100: number | string;
  project: string | null;
  description: string | null;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approver_name: string | null;
  approval_note: string | null;
  created_at: string;
  updated_at: string;
  total_count: number | string;
}

function toError(err: { message?: string; code?: string } | null): TimesheetError {
  const m = err?.message ?? '';
  const map: Partial<Record<string, TimesheetError['code']>> = {
    invalid_status: 'invalid_status',
    invalid_hours: 'invalid_hours',
    missing_required_fields: 'missing_required_fields',
    entry_not_found: 'entry_not_found',
  };
  if (map[m]) return new TimesheetError(map[m]!);
  if (err?.code === 'P0002') return new TimesheetError('entry_not_found');
  if (err?.code === '42501') return new TimesheetError('forbidden');
  return new TimesheetError('unknown', m);
}

function toInt(v: number | string): number {
  return typeof v === 'number' ? v : Number.parseInt(v, 10);
}

function mapRow(row: EntryRow): TimesheetEntry | null {
  const status = parseTimesheetStatus(row.status);
  if (status === null) return null;
  return {
    entryId:      row.entry_id,
    userId:       row.user_id,
    userName:     row.user_name,
    workDate:     row.work_date.slice(0, 10),
    hoursX100:    toInt(row.hours_x100),
    project:      row.project,
    description:  row.description,
    status,
    submittedAt:  row.submitted_at === null ? null : new Date(row.submitted_at),
    approvedAt:   row.approved_at  === null ? null : new Date(row.approved_at),
    approvedBy:   row.approved_by,
    approverName: row.approver_name,
    approvalNote: row.approval_note,
    createdAt:    new Date(row.created_at),
    updatedAt:    new Date(row.updated_at),
  };
}

function totalOf(rows: readonly EntryRow[]): number {
  if (rows.length === 0) return 0;
  return toInt(rows[0]!.total_count);
}

export class SupabaseTimesheetsRepository implements ITimesheetsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: TimesheetListFilters): Promise<TimesheetPage> {
    const { data, error } = await this.client.rpc('timesheet_list', {
      p_user_id: filters.userId ?? null,
      p_status:  filters.status ?? null,
      p_from:    filters.fromDate ?? null,
      p_to:      filters.toDate   ?? null,
      p_limit:   filters.limit  ?? 100,
      p_offset:  filters.offset ?? 0,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as EntryRow[]) : [];
    const rows: TimesheetEntry[] = [];
    for (const r of raw) {
      const m = mapRow(r);
      if (m !== null) rows.push(m);
    }
    return { rows, totalCount: totalOf(raw) };
  }

  async upsert(input: TimesheetUpsertInput): Promise<string> {
    const { data, error } = await this.client.rpc('timesheet_upsert', {
      p_entry_id:   input.entryId ?? null,
      p_work_date:  input.workDate ?? null,
      p_hours_x100: input.hoursX100 ?? null,
      p_project:    input.project ?? null,
      p_description: input.description ?? null,
    });
    if (error) throw toError(error);
    if (typeof data !== 'string') {
      throw new TimesheetError('unknown', 'timesheet_upsert did not return an id');
    }
    return data;
  }

  async submit(entryId: string): Promise<void> {
    const { error } = await this.client.rpc('timesheet_submit', { p_entry_id: entryId });
    if (error) throw toError(error);
  }

  async approve(entryId: string, note?: string | null): Promise<void> {
    const { error } = await this.client.rpc('timesheet_approve', {
      p_entry_id: entryId, p_note: note ?? null,
    });
    if (error) throw toError(error);
  }

  async reject(entryId: string, note?: string | null): Promise<void> {
    const { error } = await this.client.rpc('timesheet_reject', {
      p_entry_id: entryId, p_note: note ?? null,
    });
    if (error) throw toError(error);
  }

  async delete(entryId: string): Promise<void> {
    const { error } = await this.client.rpc('timesheet_delete', { p_entry_id: entryId });
    if (error) throw toError(error);
  }
}
