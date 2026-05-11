import { describe, it, expect } from 'vitest';
import { ConfirmReportUseCase } from '../ConfirmReportUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('ConfirmReportUseCase', () => {
  it('forwards reportId to repo.confirmReport', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new ConfirmReportUseCase(repo);

    await uc.execute({ reportId: 'r_1' });

    expect(repo.confirmCalls).toEqual(['r_1']);
  });
});
