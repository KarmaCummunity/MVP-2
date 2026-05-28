import { describe, expect, it } from 'vitest';
import { DeleteAdminTaskUseCase } from '../DeleteAdminTaskUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('DeleteAdminTaskUseCase', () => {
  it('forwards delete to repo', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new DeleteAdminTaskUseCase(repo);
    await uc.execute('t1');
    expect(repo.delete).toHaveBeenCalledWith('t1');
  });

  it('rejects empty task_id', async () => {
    const uc = new DeleteAdminTaskUseCase(fakeAdminTaskRepo());
    await expect(uc.execute('')).rejects.toMatchObject({ code: 'invalid_input' });
  });
});
