import { describe, expect, it, vi } from 'vitest';
import type { AdminTask } from '@kc/domain';
import { ListAdminTasksUseCase } from '../ListAdminTasksUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

function task(overrides: Partial<AdminTask> = {}): AdminTask {
  return {
    taskId: 't1', title: 'x', description: null,
    status: 'open', priority: 'medium', category: 'other',
    assigneeId: null,
    assigneeDisplayName: null, createdBy: 'u1', createdByDisplayName: null,
    dueAt: null, labels: [], createdAt: new Date(), updatedAt: new Date(),
    commentCount: 0, ...overrides,
  };
}

describe('ListAdminTasksUseCase', () => {
  it('passes filters straight through to the repo', async () => {
    const repo = fakeAdminTaskRepo({ list: vi.fn(async () => [task()]) });
    const uc = new ListAdminTasksUseCase(repo);
    await uc.execute({ onlyMine: true, status: 'open' });
    expect(repo.list).toHaveBeenCalledWith({ onlyMine: true, status: 'open' });
  });

  it('returns the repo rows verbatim', async () => {
    const rows = [task({ taskId: 'a' }), task({ taskId: 'b' })];
    const repo = fakeAdminTaskRepo({ list: vi.fn(async () => rows) });
    const uc = new ListAdminTasksUseCase(repo);
    expect(await uc.execute({})).toBe(rows);
  });
});
