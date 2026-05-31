import type { ICrmContactsRepository } from './ICrmContactsRepository';

export class DeleteCrmContactUseCase {
  constructor(private readonly repo: ICrmContactsRepository) {}

  async execute(contactId: string): Promise<void> {
    await this.repo.delete(contactId);
  }
}
