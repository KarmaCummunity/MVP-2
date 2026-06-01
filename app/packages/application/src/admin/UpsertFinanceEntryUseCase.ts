import { FinanceLedgerError } from '@kc/domain';
import type {
  FinanceLedgerUpsertInput, IFinanceLedgerRepository,
} from './IFinanceLedgerRepository';

export class UpsertFinanceEntryUseCase {
  constructor(private readonly repo: IFinanceLedgerRepository) {}

  async execute(input: FinanceLedgerUpsertInput): Promise<string> {
    if (!input.entryId) {
      if (!input.kind) throw new FinanceLedgerError('missing_required_fields', 'kind required');
      if (input.amountCents == null || input.amountCents < 0) {
        throw new FinanceLedgerError('invalid_amount', 'non-negative amount required');
      }
    }
    return this.repo.upsert(input);
  }
}
