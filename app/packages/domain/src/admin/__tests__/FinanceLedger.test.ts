import { describe, expect, it } from 'vitest';
import {
  FINANCE_ENTRY_KINDS,
  FINANCE_ENTRY_STATUSES,
  FinanceLedgerError,
  directionOfKind,
  isFinanceLedgerError,
  parseFinanceEntryKind,
  parseFinanceEntryStatus,
} from '../FinanceLedger';

describe('directionOfKind', () => {
  it('classifies donation/grant as inflow', () => {
    expect(directionOfKind('donation_in')).toBe('in');
    expect(directionOfKind('grant_in')).toBe('in');
  });

  it('classifies expense/refund as outflow', () => {
    expect(directionOfKind('expense')).toBe('out');
    expect(directionOfKind('refund_out')).toBe('out');
  });

  it('returns null for transfer (caller must choose a direction)', () => {
    expect(directionOfKind('transfer')).toBeNull();
  });
});

describe('parseFinanceEntryKind / parseFinanceEntryStatus', () => {
  it.each(FINANCE_ENTRY_KINDS)('accepts canonical kind "%s"', (k) => {
    expect(parseFinanceEntryKind(k)).toBe(k);
  });

  it.each(FINANCE_ENTRY_STATUSES)('accepts canonical status "%s"', (s) => {
    expect(parseFinanceEntryStatus(s)).toBe(s);
  });

  it('rejects unknown values', () => {
    expect(parseFinanceEntryKind('foo')).toBeNull();
    expect(parseFinanceEntryStatus('foo')).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(parseFinanceEntryKind(null)).toBeNull();
    expect(parseFinanceEntryKind(undefined)).toBeNull();
    expect(parseFinanceEntryStatus(null)).toBeNull();
    expect(parseFinanceEntryStatus(undefined)).toBeNull();
  });
});

describe('FinanceLedgerError', () => {
  it('carries the code and optional message', () => {
    const e = new FinanceLedgerError('invalid_amount', 'cents must be > 0');
    expect(e.code).toBe('invalid_amount');
    expect(e.message).toBe('cents must be > 0');
    expect(e.name).toBe('FinanceLedgerError');
  });

  it('falls back to the code as the message', () => {
    expect(new FinanceLedgerError('entry_not_found').message).toBe('entry_not_found');
  });
});

describe('isFinanceLedgerError', () => {
  it('narrows FinanceLedgerError instances', () => {
    expect(isFinanceLedgerError(new FinanceLedgerError('unknown'))).toBe(true);
  });

  it('rejects other values', () => {
    expect(isFinanceLedgerError(new Error('boom'))).toBe(false);
    expect(isFinanceLedgerError({ code: 'unknown' })).toBe(false);
    expect(isFinanceLedgerError(null)).toBe(false);
  });
});
