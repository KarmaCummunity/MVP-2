import { describe, expect, it } from 'vitest';
import { CreateAdminTaskUseCase } from '../CreateAdminTaskUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('CreateAdminTaskUseCase', () => {
  it('returns the new task_id on happy path', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new CreateAdminTaskUseCase(repo);
    expect(await uc.execute({ title: 'Fix the thing' })).toBe('task-1');
  });

  it('trims the title before sending to the repo', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new CreateAdminTaskUseCase(repo);
    await uc.execute({ title: '   spaced   ' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'spaced' }));
  });

  it('throws invalid_title when the title is whitespace-only', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new CreateAdminTaskUseCase(repo);
    await expect(uc.execute({ title: '   ' })).rejects.toMatchObject({ code: 'invalid_title' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws title_too_long for titles past 200 chars', async () => {
    const uc = new CreateAdminTaskUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ title: 'x'.repeat(201) })).rejects.toMatchObject({
      code: 'title_too_long',
    });
  });

  it('throws invalid_priority for unknown priority values', async () => {
    const uc = new CreateAdminTaskUseCase(fakeAdminTaskRepo());
    // @ts-expect-error testing runtime rejection of invalid priority
    await expect(uc.execute({ title: 'ok', priority: 'super_urgent' })).rejects.toMatchObject({
      code: 'invalid_priority',
    });
  });

  it('forwards optional fields (description, dueAt, labels, assignee)', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new CreateAdminTaskUseCase(repo);
    const due = new Date('2026-12-31');
    await uc.execute({
      title: 'with extras',
      description: 'd',
      assigneeId: 'u-1',
      priority: 'high',
      dueAt: due,
      labels: ['p0', 'urgent'],
    });
    expect(repo.create).toHaveBeenCalledWith({
      title: 'with extras',
      description: 'd',
      assigneeId: 'u-1',
      priority: 'high',
      dueAt: due,
      labels: ['p0', 'urgent'],
    });
  });
});
