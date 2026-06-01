import { describe, expect, it } from 'vitest';
import {
  TIMESHEET_STATUSES,
  TimesheetError,
  isTimesheetError,
  parseTimesheetStatus,
} from '../TimesheetEntry';

describe('parseTimesheetStatus', () => {
  it.each(TIMESHEET_STATUSES)('accepts canonical status "%s"', (s) => {
    expect(parseTimesheetStatus(s)).toBe(s);
  });

  it('rejects unknown values', () => {
    expect(parseTimesheetStatus('limbo')).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(parseTimesheetStatus(null)).toBeNull();
    expect(parseTimesheetStatus(undefined)).toBeNull();
  });
});

describe('TimesheetError', () => {
  it('carries code and explicit message', () => {
    const e = new TimesheetError('invalid_hours', 'must be < 24');
    expect(e.code).toBe('invalid_hours');
    expect(e.message).toBe('must be < 24');
    expect(e.name).toBe('TimesheetError');
  });

  it('falls back to the code for the message', () => {
    expect(new TimesheetError('entry_not_found').message).toBe('entry_not_found');
  });
});

describe('isTimesheetError', () => {
  it('narrows TimesheetError instances', () => {
    expect(isTimesheetError(new TimesheetError('unknown'))).toBe(true);
  });

  it('rejects other values', () => {
    expect(isTimesheetError(new Error('plain'))).toBe(false);
    expect(isTimesheetError({ code: 'unknown' })).toBe(false);
    expect(isTimesheetError(null)).toBe(false);
  });
});
