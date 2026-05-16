import { describe, it, expect } from 'vitest';
import { ReportDonationLinkUseCase } from '../ReportDonationLinkUseCase';
import { FakeDonationLinksRepository } from './fakeDonationLinksRepository';

describe('ReportDonationLinkUseCase', () => {
  it('forwards the linkId to repo.report', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new ReportDonationLinkUseCase(repo);

    await uc.execute({ linkId: 'l_abc' });

    expect(repo.lastReportedLinkId).toBe('l_abc');
  });

  it('propagates repo errors', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.reportError = new Error('rate_limited');
    const uc = new ReportDonationLinkUseCase(repo);

    await expect(uc.execute({ linkId: 'l_abc' })).rejects.toThrow('rate_limited');
  });
});
