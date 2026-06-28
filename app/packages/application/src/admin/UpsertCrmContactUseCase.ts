import { CrmContactError } from '@kc/domain';
import type { CrmContactUpsertInput, ICrmContactsRepository } from './ICrmContactsRepository';

export class UpsertCrmContactUseCase {
  constructor(private readonly repo: ICrmContactsRepository) {}

  async execute(input: CrmContactUpsertInput): Promise<string> {
    // When creating, name is required. The DB enforces too, but failing fast on
    // the client side gives a friendlier error code.
    if (!input.contactId && (!input.name || input.name.trim().length === 0)) {
      throw new CrmContactError('invalid_name', 'name required');
    }
    return this.repo.upsert(input);
  }
}
