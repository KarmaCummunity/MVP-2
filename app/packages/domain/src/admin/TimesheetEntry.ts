// V2-ADMIN-TIME-10 — domain types for the admin timesheet workflow.

export const TIMESHEET_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export function parseTimesheetStatus(v: string | null | undefined): TimesheetStatus | null {
  if (v == null) return null;
  return (TIMESHEET_STATUSES as readonly string[]).includes(v)
    ? (v as TimesheetStatus)
    : null;
}

export interface TimesheetEntry {
  readonly entryId: string;
  readonly userId: string;
  readonly userName: string | null;
  readonly workDate: string;       // ISO date YYYY-MM-DD
  readonly hoursX100: number;      // store integer (avoid float drift); display = / 100
  readonly project: string | null;
  readonly description: string | null;
  readonly status: TimesheetStatus;
  readonly submittedAt: Date | null;
  readonly approvedAt: Date | null;
  readonly approvedBy: string | null;
  readonly approverName: string | null;
  readonly approvalNote: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TimesheetPage {
  readonly rows: readonly TimesheetEntry[];
  readonly totalCount: number;
}

export type TimesheetErrorCode =
  | 'forbidden'
  | 'invalid_status'
  | 'invalid_hours'
  | 'missing_required_fields'
  | 'entry_not_found'
  | 'unknown';

export class TimesheetError extends Error {
  constructor(public readonly code: TimesheetErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'TimesheetError';
  }
}

export function isTimesheetError(value: unknown): value is TimesheetError {
  return value instanceof TimesheetError;
}
