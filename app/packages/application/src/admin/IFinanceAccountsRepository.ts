// FR-BO-100 — port for chart-of-accounts operations.
import type { FinanceAccount, FinanceAccountType } from '@kc/domain';

export interface FinanceAccountListFilters {
  readonly type?: FinanceAccountType;
  readonly activeOnly?: boolean;
}

export interface FinanceAccountUpsertInput {
  readonly id?: string | null;
  readonly code: string;
  readonly name: string;
  readonly type: FinanceAccountType;
  readonly parentId?: string | null;
  readonly isActive?: boolean;
}

export interface IFinanceAccountsRepository {
  list(filters: FinanceAccountListFilters): Promise<readonly FinanceAccount[]>;
  upsert(input: FinanceAccountUpsertInput): Promise<string>;
}
