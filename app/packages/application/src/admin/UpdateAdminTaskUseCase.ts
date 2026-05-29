import {
  AdminTaskError,
  ADMIN_TASK_CATEGORIES,
  ADMIN_TASK_PRIORITIES,
} from '@kc/domain';
import type { IAdminTaskRepository, UpdateAdminTaskInput } from './IAdminTaskRepository';

export interface UpdateAdminTaskCommand {
  readonly taskId: string;
  readonly patch: UpdateAdminTaskInput;
}

export class UpdateAdminTaskUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute({ taskId, patch }: UpdateAdminTaskCommand): Promise<void> {
    if (!taskId) throw new AdminTaskError('invalid_input', 'task_id required');
    if (patch.title !== undefined) {
      const t = patch.title.trim();
      if (t.length === 0) throw new AdminTaskError('invalid_title', 'title may not be empty');
      if (t.length > 200) throw new AdminTaskError('title_too_long', 'title must be ≤ 200 chars');
    }
    if (
      patch.priority !== undefined
      && !(ADMIN_TASK_PRIORITIES as readonly string[]).includes(patch.priority)
    ) {
      throw new AdminTaskError('invalid_priority');
    }
    if (
      patch.category !== undefined
      && !(ADMIN_TASK_CATEGORIES as readonly string[]).includes(patch.category)
    ) {
      throw new AdminTaskError('invalid_category', 'unknown category');
    }
    await this.repo.update(taskId, patch);
  }
}
