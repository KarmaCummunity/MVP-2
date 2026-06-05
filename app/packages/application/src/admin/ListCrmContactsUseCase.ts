import type { CrmContactPage } from '@kc/domain';
import type { CrmContactListFilters, ICrmContactsRepository } from './ICrmContactsRepository';

export class ListCrmContactsUseCase {
  constructor(private readonly repo: ICrmContactsRepository) {}

  async execute(filters: CrmContactListFilters): Promise<CrmContactPage> {
    return this.repo.list(filters);
  }
}
