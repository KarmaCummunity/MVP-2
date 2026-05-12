import { describe, it, expect } from 'vitest';
import { DismissReportUseCase } from '../DismissReportUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('DismissReportUseCase', () => {
  it('forwards reportId to repo.dismissReport', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new DismissReportUseCase(repo);

    await uc.execute({ reportId: 'r_1' });

    expect(repo.dismissCalls).toEqual(['r_1']);
  });
});
