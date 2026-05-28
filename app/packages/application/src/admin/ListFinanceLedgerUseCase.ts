import type { FinanceLedgerPage } from '@kc/domain';
import type {
  FinanceLedgerListFilters, IFinanceLedgerRepository,
} from './IFinanceLedgerRepository';

export class ListFinanceLedgerUseCase {
  constructor(private readonly repo: IFinanceLedgerRepository) {}

  execute(filters: FinanceLedgerListFilters): Promise<FinanceLedgerPage> {
    return this.repo.list(filters);
  }
}
