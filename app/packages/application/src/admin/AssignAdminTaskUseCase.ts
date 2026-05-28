import { AdminTaskError } from '@kc/domain';
import type { IAdminTaskRepository } from './IAdminTaskRepository';

export interface AssignAdminTaskCommand {
  readonly taskId: string;
  readonly newAssigneeId: string | null;
}

export class AssignAdminTaskUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute({ taskId, newAssigneeId }: AssignAdminTaskCommand): Promise<void> {
    if (!taskId) throw new AdminTaskError('invalid_input', 'task_id required');
    await this.repo.assign(taskId, newAssigneeId);
  }
}
