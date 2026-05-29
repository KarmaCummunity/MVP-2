export const ADMIN_TASK_ACTIVITY_KINDS = [
  'created',
  'comment',
  'status_change',
  'assignment_change',
  'priority_change',
  'due_change',
  'title_change',
  'description_change',
  'labels_change',
  'category_change',
] as const;
export type AdminTaskActivityKind = (typeof ADMIN_TASK_ACTIVITY_KINDS)[number];

export interface AdminTaskActivity {
  readonly activityId: string;
  readonly actorId: string | null;
  readonly actorDisplayName: string | null;
  readonly kind: AdminTaskActivityKind;
  readonly payload: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface AdminTaskWithActivities {
  readonly task: import('./AdminTask').AdminTask;
  readonly activities: readonly AdminTaskActivity[];
}

export function parseAdminTaskActivityKind(
  value: string | null | undefined,
): AdminTaskActivityKind | null {
  if (value == null) return null;
  return (ADMIN_TASK_ACTIVITY_KINDS as readonly string[]).includes(value)
    ? (value as AdminTaskActivityKind)
    : null;
}
