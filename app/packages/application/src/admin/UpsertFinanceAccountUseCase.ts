import { FinanceAccountError } from '@kc/domain';
import type {
  IFinanceAccountsRepository,
  FinanceAccountUpsertInput,
} from './IFinanceAccountsRepository';

export class UpsertFinanceAccountUseCase {
  constructor(private readonly repo: IFinanceAccountsRepository) {}

  async execute(input: FinanceAccountUpsertInput): Promise<string> {
    if (input.code.trim() === '' || input.name.trim() === '') {
      throw new FinanceAccountError('missing_required_fields');
    }
    return this.repo.upsert(input);
  }
}
