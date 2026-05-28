export const ADMIN_TASK_STATUSES = [
  'open',
  'in_progress',
  'blocked',
  'done',
  'archived',
] as const;
export type AdminTaskStatus = (typeof ADMIN_TASK_STATUSES)[number];

export const ADMIN_TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type AdminTaskPriority = (typeof ADMIN_TASK_PRIORITIES)[number];

export interface AdminTask {
  readonly taskId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: AdminTaskStatus;
  readonly priority: AdminTaskPriority;
  readonly assigneeId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly createdBy: string;
  readonly createdByDisplayName: string | null;
  readonly dueAt: Date | null;
  readonly labels: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly commentCount: number;
}

const ALLOWED_TRANSITIONS: Readonly<Record<AdminTaskStatus, readonly AdminTaskStatus[]>> = {
  open:        ['in_progress', 'blocked'],
  in_progress: ['open', 'blocked', 'done'],
  blocked:     ['open', 'in_progress', 'done'],
  done:        ['in_progress', 'archived'],
  archived:    [],
};

export function isStatusTransitionAllowed(
  from: AdminTaskStatus,
  to: AdminTaskStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function parseAdminTaskStatus(value: string | null | undefined): AdminTaskStatus | null {
  if (value == null) return null;
  return (ADMIN_TASK_STATUSES as readonly string[]).includes(value)
    ? (value as AdminTaskStatus)
    : null;
}

export function parseAdminTaskPriority(value: string | null | undefined): AdminTaskPriority | null {
  if (value == null) return null;
  return (ADMIN_TASK_PRIORITIES as readonly string[]).includes(value)
    ? (value as AdminTaskPriority)
    : null;
}

export function isOverdue(task: AdminTask, now: Date = new Date()): boolean {
  if (task.dueAt === null) return false;
  if (task.status === 'done' || task.status === 'archived') return false;
  return task.dueAt.getTime() < now.getTime();
}
