import type { ICrmContactsRepository } from './ICrmContactsRepository';

export class MarkCrmContactContactedUseCase {
  constructor(private readonly repo: ICrmContactsRepository) {}

  async execute(contactId: string): Promise<void> {
    await this.repo.markContacted(contactId);
  }
}
