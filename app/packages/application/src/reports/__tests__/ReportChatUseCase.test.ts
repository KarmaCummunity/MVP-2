import { describe, it, expect } from 'vitest';
import { ReportChatUseCase } from '../ReportChatUseCase';
import { FakeReportRepository } from './fakeReportRepository';

describe('ReportChatUseCase', () => {
  it('submits with targetType="chat" and forwards chatId, reason, note', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportChatUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      chatId: 'c_target',
      reason: 'Harassment',
      note: 'מטריד באופן עקבי',
    });

    expect(repo.lastSubmit).not.toBeNull();
    expect(repo.lastSubmit!.reporterId).toBe('u_reporter');
    expect(repo.lastSubmit!.input).toEqual({
      targetType: 'chat',
      targetId: 'c_target',
      reason: 'Harassment',
      note: 'מטריד באופן עקבי',
    });
  });

  it('omits note when not provided', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportChatUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      chatId: 'c_target',
      reason: 'Spam',
    });

    expect(repo.lastSubmit!.input.note).toBeUndefined();
    expect(repo.lastSubmit!.input.targetType).toBe('chat');
  });

  it('propagates repo errors (e.g. 24h dedup)', async () => {
    const repo = new FakeReportRepository();
    repo.submitError = new Error('duplicate_within_24h');
    const uc = new ReportChatUseCase(repo);

    await expect(
      uc.execute({ reporterId: 'u_reporter', chatId: 'c_target', reason: 'Spam' }),
    ).rejects.toThrow('duplicate_within_24h');
  });
});
