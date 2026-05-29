import type { IFinanceLedgerRepository } from './IFinanceLedgerRepository';

export class DeleteFinanceEntryUseCase {
  constructor(private readonly repo: IFinanceLedgerRepository) {}

  async execute(entryId: string): Promise<void> {
    await this.repo.delete(entryId);
  }
}
