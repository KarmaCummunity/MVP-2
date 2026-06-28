// V2-ADMIN-MONEY-9 — port for the admin finance ledger.
import type {
  FinanceDirection, FinanceEntryKind, FinanceEntryStatus, FinanceLedgerPage, FinanceSummaryRow,
} from '@kc/domain';

export interface FinanceLedgerListFilters {
  readonly direction?: FinanceDirection;
  readonly kind?: FinanceEntryKind;
  readonly status?: FinanceEntryStatus;
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

export interface FinanceLedgerUpsertInput {
  readonly entryId?: string | null;
  readonly kind?: FinanceEntryKind;
  readonly amountCents?: number;
  readonly currency?: string;
  readonly occurredAt?: Date;
  readonly counterparty?: string | null;
  readonly category?: string | null;
  readonly description?: string | null;
  readonly referenceUrl?: string | null;
  readonly status?: FinanceEntryStatus;
}

export interface IFinanceLedgerRepository {
  list(filters: FinanceLedgerListFilters): Promise<FinanceLedgerPage>;
  summary(fromDate?: Date, toDate?: Date): Promise<readonly FinanceSummaryRow[]>;
  upsert(input: FinanceLedgerUpsertInput): Promise<string>;
  delete(entryId: string): Promise<void>;
}
