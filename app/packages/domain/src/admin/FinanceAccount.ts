// FR-BO-100 — chart-of-accounts domain types.

export const FINANCE_ACCOUNT_TYPES = [
  'income',
  'expense',
  'asset',
  'liability',
  'equity',
] as const;
export type FinanceAccountType = (typeof FINANCE_ACCOUNT_TYPES)[number];

export function parseFinanceAccountType(
  v: string | null | undefined,
): FinanceAccountType | null {
  if (v == null) return null;
  return (FINANCE_ACCOUNT_TYPES as readonly string[]).includes(v)
    ? (v as FinanceAccountType)
    : null;
}

export interface FinanceAccount {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: FinanceAccountType;
  readonly parentId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type FinanceAccountErrorCode =
  | 'forbidden'
  | 'invalid_type'
  | 'missing_required_fields'
  | 'account_not_found'
  | 'duplicate_code'
  | 'unknown';

export class FinanceAccountError extends Error {
  constructor(public readonly code: FinanceAccountErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'FinanceAccountError';
  }
}

export function isFinanceAccountError(value: unknown): value is FinanceAccountError {
  return value instanceof FinanceAccountError;
}
