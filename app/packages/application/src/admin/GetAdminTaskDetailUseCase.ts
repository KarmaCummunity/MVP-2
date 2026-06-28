import type { AdminTaskWithActivities } from '@kc/domain';
import type { IAdminTaskRepository } from './IAdminTaskRepository';

export class GetAdminTaskDetailUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute(taskId: string): Promise<AdminTaskWithActivities | null> {
    if (!taskId) return null;
    return this.repo.getDetail(taskId);
  }
}
