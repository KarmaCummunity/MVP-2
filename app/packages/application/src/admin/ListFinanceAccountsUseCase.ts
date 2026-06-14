import type { FinanceAccount } from '@kc/domain';
import type {
  IFinanceAccountsRepository,
  FinanceAccountListFilters,
} from './IFinanceAccountsRepository';

export class ListFinanceAccountsUseCase {
  constructor(private readonly repo: IFinanceAccountsRepository) {}

  async execute(filters: FinanceAccountListFilters = {}): Promise<readonly FinanceAccount[]> {
    return this.repo.list(filters);
  }
}
