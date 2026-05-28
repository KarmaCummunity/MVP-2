import { AdminTaskError } from '@kc/domain';
import type { IAdminTaskRepository } from './IAdminTaskRepository';

export class DeleteAdminTaskUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute(taskId: string): Promise<void> {
    if (!taskId) throw new AdminTaskError('invalid_input', 'task_id required');
    await this.repo.delete(taskId);
  }
}
