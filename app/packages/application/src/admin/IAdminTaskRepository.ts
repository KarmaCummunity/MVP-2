import type {
  AdminTask,
  AdminTaskCategory,
  AdminTaskPriority,
  AdminTaskStatus,
  AdminTaskWithActivities,
} from '@kc/domain';

export interface AdminTaskListFilters {
  readonly status?: AdminTaskStatus;
  readonly assigneeId?: string;
  readonly onlyMine?: boolean;
  readonly overdue?: boolean;
  readonly priority?: AdminTaskPriority;
  readonly category?: AdminTaskCategory;
  readonly label?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CreateAdminTaskInput {
  readonly title: string;
  readonly description?: string | null;
  readonly priority?: AdminTaskPriority;
  readonly category?: AdminTaskCategory;
  readonly assigneeId?: string | null;
  readonly dueAt?: Date | null;
  readonly labels?: readonly string[];
}

export interface UpdateAdminTaskInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly priority?: AdminTaskPriority;
  readonly category?: AdminTaskCategory;
  readonly dueAt?: Date | null;
  readonly clearDue?: boolean;
  readonly labels?: readonly string[];
}

export interface IAdminTaskRepository {
  list(filters: AdminTaskListFilters): Promise<readonly AdminTask[]>;
  getDetail(taskId: string): Promise<AdminTaskWithActivities | null>;
  create(input: CreateAdminTaskInput): Promise<string>;
  update(taskId: string, patch: UpdateAdminTaskInput): Promise<void>;
  setStatus(taskId: string, newStatus: AdminTaskStatus): Promise<void>;
  assign(taskId: string, newAssigneeId: string | null): Promise<void>;
  addComment(taskId: string, body: string): Promise<string>;
  delete(taskId: string): Promise<void>;
}
