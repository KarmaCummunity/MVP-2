import { describe, expect, it } from 'vitest';
import {
  ADMIN_TASK_PRIORITIES,
  ADMIN_TASK_STATUSES,
  isOverdue,
  isStatusTransitionAllowed,
  parseAdminTaskPriority,
  parseAdminTaskStatus,
  type AdminTask,
} from '../AdminTask';

function makeTask(overrides: Partial<AdminTask> = {}): AdminTask {
  return {
    taskId: 'task-1',
    title: 'Review report',
    description: null,
    status: 'open',
    priority: 'medium',
    assigneeId: null,
    assigneeDisplayName: null,
    createdBy: 'admin-1',
    createdByDisplayName: 'Admin',
    dueAt: null,
    labels: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    commentCount: 0,
    ...overrides,
  };
}

describe('AdminTask', () => {
  it('exposes known statuses and priorities', () => {
    expect(ADMIN_TASK_STATUSES).toContain('open');
    expect(ADMIN_TASK_PRIORITIES).toContain('urgent');
  });

  it('parseAdminTaskStatus accepts known values and rejects unknown', () => {
    expect(parseAdminTaskStatus('in_progress')).toBe('in_progress');
    expect(parseAdminTaskStatus('nope')).toBeNull();
    expect(parseAdminTaskStatus(null)).toBeNull();
  });

  it('parseAdminTaskPriority accepts known values and rejects unknown', () => {
    expect(parseAdminTaskPriority('high')).toBe('high');
    expect(parseAdminTaskPriority('critical')).toBeNull();
    expect(parseAdminTaskPriority(undefined)).toBeNull();
  });

  it('isStatusTransitionAllowed permits same status and valid edges', () => {
    expect(isStatusTransitionAllowed('open', 'open')).toBe(true);
    expect(isStatusTransitionAllowed('open', 'in_progress')).toBe(true);
    expect(isStatusTransitionAllowed('open', 'done')).toBe(false);
    expect(isStatusTransitionAllowed('archived', 'open')).toBe(false);
  });

  it('isOverdue is false without due date or when closed', () => {
    expect(isOverdue(makeTask())).toBe(false);
    expect(isOverdue(makeTask({ status: 'done', dueAt: new Date('2020-01-01') }))).toBe(false);
  });

  it('isOverdue is true when due date is in the past for active tasks', () => {
    const now = new Date('2026-05-28T12:00:00Z');
    expect(
      isOverdue(makeTask({ dueAt: new Date('2026-05-27T12:00:00Z') }), now),
    ).toBe(true);
  });
});
