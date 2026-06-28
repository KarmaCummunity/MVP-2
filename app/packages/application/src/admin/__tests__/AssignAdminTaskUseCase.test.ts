import { describe, expect, it } from 'vitest';
import { AssignAdminTaskUseCase } from '../AssignAdminTaskUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('AssignAdminTaskUseCase', () => {
  it('forwards assignment changes', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new AssignAdminTaskUseCase(repo);
    await uc.execute({ taskId: 't1', newAssigneeId: 'u-2' });
    expect(repo.assign).toHaveBeenCalledWith('t1', 'u-2');
  });

  it('supports unassignment (null)', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new AssignAdminTaskUseCase(repo);
    await uc.execute({ taskId: 't1', newAssigneeId: null });
    expect(repo.assign).toHaveBeenCalledWith('t1', null);
  });

  it('rejects empty task_id', async () => {
    const uc = new AssignAdminTaskUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ taskId: '', newAssigneeId: null })).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });
});
