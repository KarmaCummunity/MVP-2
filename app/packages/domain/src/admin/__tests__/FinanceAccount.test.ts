import { describe, expect, it } from 'vitest';
import {
  FINANCE_ACCOUNT_TYPES,
  FinanceAccountError,
  isFinanceAccountError,
  parseFinanceAccountType,
} from '../FinanceAccount';

describe('parseFinanceAccountType', () => {
  it('accepts every known type', () => {
    for (const t of FINANCE_ACCOUNT_TYPES) {
      expect(parseFinanceAccountType(t)).toBe(t);
    }
  });

  it('rejects unknown / nullish', () => {
    expect(parseFinanceAccountType('revenue')).toBeNull();
    expect(parseFinanceAccountType(null)).toBeNull();
    expect(parseFinanceAccountType(undefined)).toBeNull();
  });
});

describe('FinanceAccountError', () => {
  it('carries its code and is recognised by the guard', () => {
    const err = new FinanceAccountError('duplicate_code');
    expect(err.code).toBe('duplicate_code');
    expect(err.name).toBe('FinanceAccountError');
    expect(isFinanceAccountError(err)).toBe(true);
    expect(isFinanceAccountError(new Error('x'))).toBe(false);
  });
});
