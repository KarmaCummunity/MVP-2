import { AdminTaskError } from '@kc/domain';
import type { IAdminTaskRepository } from './IAdminTaskRepository';

export interface AddAdminTaskCommentCommand {
  readonly taskId: string;
  readonly body: string;
}

export class AddAdminTaskCommentUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute({ taskId, body }: AddAdminTaskCommentCommand): Promise<string> {
    if (!taskId) throw new AdminTaskError('invalid_input', 'task_id required');
    const trimmed = body?.trim() ?? '';
    if (trimmed.length === 0) throw new AdminTaskError('empty_comment');
    if (trimmed.length > 4000) throw new AdminTaskError('comment_too_long');
    return this.repo.addComment(taskId, trimmed);
  }
}
