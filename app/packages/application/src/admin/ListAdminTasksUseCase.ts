import type { AdminTask } from '@kc/domain';
import type { AdminTaskListFilters, IAdminTaskRepository } from './IAdminTaskRepository';

export class ListAdminTasksUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute(filters: AdminTaskListFilters): Promise<readonly AdminTask[]> {
    return this.repo.list(filters);
  }
}
