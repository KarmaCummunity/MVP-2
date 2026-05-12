import { describe, it, expect } from 'vitest';
import { RemoveDonationLinkUseCase } from '../RemoveDonationLinkUseCase';
import { DonationLinkError } from '../errors';
import { FakeDonationLinksRepository } from './fakeDonationLinksRepository';

describe('RemoveDonationLinkUseCase', () => {
  it('forwards the link id to the repository for delete', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new RemoveDonationLinkUseCase(repo);
    await uc.execute('l_42');
    expect(repo.lastDeleteId).toBe('l_42');
  });

  it('propagates repository errors', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.deleteError = new DonationLinkError('network', 'down');
    const uc = new RemoveDonationLinkUseCase(repo);
    await expect(uc.execute('l_1')).rejects.toMatchObject({ code: 'network' });
  });
});
