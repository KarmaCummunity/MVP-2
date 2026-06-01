import type { FinanceSummaryRow } from '@kc/domain';
import type { IFinanceLedgerRepository } from './IFinanceLedgerRepository';

export class GetFinanceSummaryUseCase {
  constructor(private readonly repo: IFinanceLedgerRepository) {}

  execute(input: { fromDate?: Date; toDate?: Date }): Promise<readonly FinanceSummaryRow[]> {
    return this.repo.summary(input.fromDate, input.toDate);
  }
}
