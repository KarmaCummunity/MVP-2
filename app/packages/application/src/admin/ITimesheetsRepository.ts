// V2-ADMIN-TIME-10 — port for the timesheets workflow.
import type { TimesheetPage, TimesheetStatus } from '@kc/domain';

export interface TimesheetListFilters {
  readonly userId?: string;
  readonly status?: TimesheetStatus;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface TimesheetUpsertInput {
  readonly entryId?: string | null;
  readonly workDate?: string;
  readonly hoursX100?: number;
  readonly project?: string | null;
  readonly description?: string | null;
}

export interface ITimesheetsRepository {
  list(filters: TimesheetListFilters): Promise<TimesheetPage>;
  upsert(input: TimesheetUpsertInput): Promise<string>;
  submit(entryId: string): Promise<void>;
  approve(entryId: string, note?: string | null): Promise<void>;
  reject(entryId: string, note?: string | null): Promise<void>;
  delete(entryId: string): Promise<void>;
}
