import { describe, expect, it } from 'vitest';
import { SetAdminTaskStatusUseCase } from '../SetAdminTaskStatusUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('SetAdminTaskStatusUseCase', () => {
  it('forwards happy-path status changes', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new SetAdminTaskStatusUseCase(repo);
    await uc.execute({ taskId: 't1', newStatus: 'in_progress' });
    expect(repo.setStatus).toHaveBeenCalledWith('t1', 'in_progress');
  });

  it('rejects unknown statuses', async () => {
    const uc = new SetAdminTaskStatusUseCase(fakeAdminTaskRepo());
    await expect(
      // @ts-expect-error testing runtime rejection
      uc.execute({ taskId: 't1', newStatus: 'pending' }),
    ).rejects.toMatchObject({ code: 'invalid_status' });
  });

  it('rejects empty task ids', async () => {
    const uc = new SetAdminTaskStatusUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ taskId: '', newStatus: 'open' })).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });
});
