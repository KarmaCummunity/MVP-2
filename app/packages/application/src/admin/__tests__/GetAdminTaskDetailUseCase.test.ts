import { describe, expect, it } from 'vitest';
import { GetAdminTaskDetailUseCase } from '../GetAdminTaskDetailUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('GetAdminTaskDetailUseCase', () => {
  it('returns null for empty task_id without hitting the repo', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new GetAdminTaskDetailUseCase(repo);
    expect(await uc.execute('')).toBeNull();
    expect(repo.getDetail).not.toHaveBeenCalled();
  });

  it('delegates to repo for non-empty ids', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new GetAdminTaskDetailUseCase(repo);
    await uc.execute('t1');
    expect(repo.getDetail).toHaveBeenCalledWith('t1');
  });
});
