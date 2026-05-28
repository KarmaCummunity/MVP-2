import { describe, expect, it } from 'vitest';
import { AddAdminTaskCommentUseCase } from '../AddAdminTaskCommentUseCase';
import { fakeAdminTaskRepo } from './fakeAdminTaskRepo';

describe('AddAdminTaskCommentUseCase', () => {
  it('trims body before sending', async () => {
    const repo = fakeAdminTaskRepo();
    const uc = new AddAdminTaskCommentUseCase(repo);
    await uc.execute({ taskId: 't1', body: '  hi  ' });
    expect(repo.addComment).toHaveBeenCalledWith('t1', 'hi');
  });

  it('returns the activity id from the repo', async () => {
    const repo = fakeAdminTaskRepo({ addComment: async () => 'a-9' });
    const uc = new AddAdminTaskCommentUseCase(repo);
    expect(await uc.execute({ taskId: 't1', body: 'ok' })).toBe('a-9');
  });

  it('rejects empty comments', async () => {
    const uc = new AddAdminTaskCommentUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ taskId: 't1', body: '   ' })).rejects.toMatchObject({
      code: 'empty_comment',
    });
  });

  it('rejects oversized comments', async () => {
    const uc = new AddAdminTaskCommentUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ taskId: 't1', body: 'x'.repeat(4001) })).rejects.toMatchObject({
      code: 'comment_too_long',
    });
  });

  it('rejects empty task_id', async () => {
    const uc = new AddAdminTaskCommentUseCase(fakeAdminTaskRepo());
    await expect(uc.execute({ taskId: '', body: 'hi' })).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });
});
