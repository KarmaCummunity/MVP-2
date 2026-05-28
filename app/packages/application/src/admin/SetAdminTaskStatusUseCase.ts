import {
  AdminTaskError,
  ADMIN_TASK_STATUSES,
  type AdminTaskStatus,
} from '@kc/domain';
import type { IAdminTaskRepository } from './IAdminTaskRepository';

export interface SetAdminTaskStatusCommand {
  readonly taskId: string;
  readonly newStatus: AdminTaskStatus;
}

export class SetAdminTaskStatusUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute({ taskId, newStatus }: SetAdminTaskStatusCommand): Promise<void> {
    if (!taskId) throw new AdminTaskError('invalid_input', 'task_id required');
    if (!(ADMIN_TASK_STATUSES as readonly string[]).includes(newStatus)) {
      throw new AdminTaskError('invalid_status');
    }
    await this.repo.setStatus(taskId, newStatus);
  }
}
