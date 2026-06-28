import {
  AdminTaskError,
  ADMIN_TASK_CATEGORIES,
  ADMIN_TASK_PRIORITIES,
  type AdminTaskCategory,
  type AdminTaskPriority,
} from '@kc/domain';
import type { CreateAdminTaskInput, IAdminTaskRepository } from './IAdminTaskRepository';

export class CreateAdminTaskUseCase {
  constructor(private readonly repo: IAdminTaskRepository) {}

  async execute(input: CreateAdminTaskInput): Promise<string> {
    const title = input.title?.trim() ?? '';
    if (title.length === 0) {
      throw new AdminTaskError('invalid_title', 'title required');
    }
    if (title.length > 200) {
      throw new AdminTaskError('title_too_long', 'title must be ≤ 200 chars');
    }
    if (input.priority !== undefined && !isValidPriority(input.priority)) {
      throw new AdminTaskError('invalid_priority', 'priority must be low|medium|high|urgent');
    }
    if (input.category !== undefined && !isValidCategory(input.category)) {
      throw new AdminTaskError('invalid_category', 'unknown category');
    }
    return this.repo.create({ ...input, title });
  }
}

function isValidPriority(value: string): value is AdminTaskPriority {
  return (ADMIN_TASK_PRIORITIES as readonly string[]).includes(value);
}

function isValidCategory(value: string): value is AdminTaskCategory {
  return (ADMIN_TASK_CATEGORIES as readonly string[]).includes(value);
}
