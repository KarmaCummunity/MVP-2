import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminTaskListFilters,
  CreateAdminTaskInput,
  IAdminTaskRepository,
  UpdateAdminTaskInput,
} from '@kc/application';
import {
  type AdminTask,
  type AdminTaskActivity,
  type AdminTaskStatus,
  type AdminTaskWithActivities,
  AdminTaskError,
  type AdminTaskErrorCode,
  parseAdminTaskActivityKind,
  parseAdminTaskPriority,
  parseAdminTaskStatus,
} from '@kc/domain';

interface AdminTaskRow {
  task_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  assignee_display_name: string | null;
  created_by: string;
  created_by_display_name: string | null;
  due_at: string | null;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

interface AdminTaskDetailRow extends AdminTaskRow {
  activities: unknown;
}

interface AdminTaskActivityJson {
  activity_id?: string;
  actor_id?: string | null;
  actor_display_name?: string | null;
  kind?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

const KNOWN_ERROR_MESSAGES: ReadonlySet<AdminTaskErrorCode> = new Set([
  'forbidden',
  'invalid_title',
  'title_too_long',
  'invalid_priority',
  'invalid_status',
  'invalid_transition',
  'invalid_input',
  'task_not_found',
  'assignee_not_admin',
  'empty_comment',
  'comment_too_long',
]);

function mapRpcError(err: { message?: string; code?: string } | null): AdminTaskError {
  const raw = err?.message ?? '';
  if ((KNOWN_ERROR_MESSAGES as Set<string>).has(raw)) {
    return new AdminTaskError(raw as AdminTaskErrorCode, raw);
  }
  if (err?.code === '42501') return new AdminTaskError('forbidden', 'forbidden');
  if (err?.code === 'P0002') return new AdminTaskError('task_not_found', 'task_not_found');
  return new AdminTaskError('unknown', raw || 'unknown_admin_task_rpc_error');
}

function mapRowToTask(row: AdminTaskRow): AdminTask | null {
  const status = parseAdminTaskStatus(row.status);
  const priority = parseAdminTaskPriority(row.priority);
  if (status === null || priority === null) return null;
  return {
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    status,
    priority,
    assigneeId: row.assignee_id,
    assigneeDisplayName: row.assignee_display_name,
    createdBy: row.created_by,
    createdByDisplayName: row.created_by_display_name,
    dueAt: row.due_at === null ? null : new Date(row.due_at),
    labels: Array.isArray(row.labels) ? row.labels : [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    commentCount: typeof row.comment_count === 'number' ? row.comment_count : 0,
  };
}

function mapActivities(raw: unknown): AdminTaskActivity[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminTaskActivity[] = [];
  for (const item of raw as AdminTaskActivityJson[]) {
    if (item === null || typeof item !== 'object') continue;
    const kind = parseAdminTaskActivityKind(item.kind);
    if (kind === null) continue;
    if (typeof item.activity_id !== 'string' || typeof item.created_at !== 'string') continue;
    out.push({
      activityId: item.activity_id,
      actorId: typeof item.actor_id === 'string' ? item.actor_id : null,
      actorDisplayName: typeof item.actor_display_name === 'string' ? item.actor_display_name : null,
      kind,
      payload: (item.payload as Record<string, unknown>) ?? {},
      createdAt: new Date(item.created_at),
    });
  }
  return out;
}

export class SupabaseAdminTaskRepository implements IAdminTaskRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: AdminTaskListFilters): Promise<readonly AdminTask[]> {
    const { data, error } = await this.client.rpc('admin_task_list', {
      p_status:    filters.status    ?? null,
      p_assignee:  filters.assigneeId ?? null,
      p_only_mine: filters.onlyMine   ?? false,
      p_overdue:   filters.overdue    ?? false,
      p_priority:  filters.priority   ?? null,
      p_label:     filters.label      ?? null,
      p_limit:     filters.limit      ?? 50,
      p_offset:    filters.offset     ?? 0,
    });
    if (error) throw mapRpcError(error);
    if (!Array.isArray(data)) return [];
    const out: AdminTask[] = [];
    for (const row of data as AdminTaskRow[]) {
      const mapped = mapRowToTask(row);
      if (mapped !== null) out.push(mapped);
    }
    return out;
  }

  async getDetail(taskId: string): Promise<AdminTaskWithActivities | null> {
    const { data, error } = await this.client.rpc('admin_task_detail', { p_task_id: taskId });
    if (error) throw mapRpcError(error);
    if (!Array.isArray(data) || data.length === 0) return null;
    const row = data[0] as AdminTaskDetailRow;
    const task = mapRowToTask(row);
    if (task === null) return null;
    return { task, activities: mapActivities(row.activities) };
  }

  async create(input: CreateAdminTaskInput): Promise<string> {
    const { data, error } = await this.client.rpc('admin_task_create', {
      p_title:       input.title,
      p_description: input.description ?? null,
      p_priority:    input.priority    ?? 'medium',
      p_assignee_id: input.assigneeId  ?? null,
      p_due_at:      input.dueAt ? input.dueAt.toISOString() : null,
      p_labels:      input.labels ? [...input.labels] : [],
    });
    if (error) throw mapRpcError(error);
    if (typeof data !== 'string') {
      throw new AdminTaskError('unknown', 'admin_task_create returned non-string task_id');
    }
    return data;
  }

  async update(taskId: string, patch: UpdateAdminTaskInput): Promise<void> {
    const { error } = await this.client.rpc('admin_task_update', {
      p_task_id:     taskId,
      p_title:       patch.title       ?? null,
      p_description: patch.description ?? null,
      p_priority:    patch.priority    ?? null,
      p_due_at:      patch.dueAt ? patch.dueAt.toISOString() : null,
      p_clear_due:   patch.clearDue    ?? false,
      p_labels:      patch.labels ? [...patch.labels] : null,
    });
    if (error) throw mapRpcError(error);
  }

  async setStatus(taskId: string, newStatus: AdminTaskStatus): Promise<void> {
    const { error } = await this.client.rpc('admin_task_set_status', {
      p_task_id:    taskId,
      p_new_status: newStatus,
    });
    if (error) throw mapRpcError(error);
  }

  async assign(taskId: string, newAssigneeId: string | null): Promise<void> {
    const { error } = await this.client.rpc('admin_task_assign', {
      p_task_id:      taskId,
      p_new_assignee: newAssigneeId,
    });
    if (error) throw mapRpcError(error);
  }

  async addComment(taskId: string, body: string): Promise<string> {
    const { data, error } = await this.client.rpc('admin_task_add_comment', {
      p_task_id: taskId,
      p_body:    body,
    });
    if (error) throw mapRpcError(error);
    if (typeof data !== 'string') {
      throw new AdminTaskError('unknown', 'admin_task_add_comment returned non-string activity_id');
    }
    return data;
  }

  async delete(taskId: string): Promise<void> {
    const { error } = await this.client.rpc('admin_task_delete', { p_task_id: taskId });
    if (error) throw mapRpcError(error);
  }
}
