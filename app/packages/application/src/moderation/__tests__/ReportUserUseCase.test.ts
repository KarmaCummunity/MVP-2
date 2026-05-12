import { describe, it, expect } from 'vitest';
import { ReportUserUseCase } from '../ReportUserUseCase';
import { ModerationError } from '../errors';
import { FakeReportRepository } from '../../reports/__tests__/fakeReportRepository';

describe('ReportUserUseCase', () => {
  it('submits with targetType="user" and forwards targetUserId, reason, note', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportUserUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      targetUserId: 'u_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });

    expect(repo.lastSubmit).not.toBeNull();
    expect(repo.lastSubmit!.reporterId).toBe('u_reporter');
    expect(repo.lastSubmit!.input).toEqual({
      targetType: 'user',
      targetId: 'u_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });
  });

  it('omits note when not provided', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportUserUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      targetUserId: 'u_target',
      reason: 'Offensive',
    });

    expect(repo.lastSubmit!.input.note).toBeUndefined();
  });

  it('rejects self-report with ModerationError("cannot_report_self") and does NOT call repo', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportUserUseCase(repo);

    await expect(
      uc.execute({ reporterId: 'u_same', targetUserId: 'u_same', reason: 'Spam' }),
    ).rejects.toBeInstanceOf(ModerationError);
    await expect(
      uc.execute({ reporterId: 'u_same', targetUserId: 'u_same', reason: 'Spam' }),
    ).rejects.toMatchObject({ code: 'cannot_report_self' });

    expect(repo.lastSubmit).toBeNull();
  });

  it('propagates repo errors', async () => {
    const repo = new FakeReportRepository();
    repo.submitError = new Error('duplicate_within_24h');
    const uc = new ReportUserUseCase(repo);

    await expect(
      uc.execute({ reporterId: 'u_reporter', targetUserId: 'u_target', reason: 'Spam' }),
    ).rejects.toThrow('duplicate_within_24h');
  });
});
