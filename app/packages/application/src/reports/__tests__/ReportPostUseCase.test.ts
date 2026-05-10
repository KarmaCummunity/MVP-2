import { describe, it, expect } from 'vitest';
import { ReportPostUseCase } from '../ReportPostUseCase';
import { FakeReportRepository } from './fakeReportRepository';

describe('ReportPostUseCase', () => {
  it('submits with targetType="post" and forwards postId, reason, note', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportPostUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      postId: 'p_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });

    expect(repo.lastSubmit).not.toBeNull();
    expect(repo.lastSubmit!.reporterId).toBe('u_reporter');
    expect(repo.lastSubmit!.input).toEqual({
      targetType: 'post',
      targetId: 'p_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });
  });

  it('omits note when not provided', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportPostUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      postId: 'p_target',
      reason: 'Offensive',
    });

    expect(repo.lastSubmit!.input.note).toBeUndefined();
  });

  it('propagates repo errors', async () => {
    const repo = new FakeReportRepository();
    repo.submitError = new Error('duplicate_within_24h');
    const uc = new ReportPostUseCase(repo);

    await expect(
      uc.execute({ reporterId: 'u_reporter', postId: 'p_target', reason: 'Spam' }),
    ).rejects.toThrow('duplicate_within_24h');
  });
});
