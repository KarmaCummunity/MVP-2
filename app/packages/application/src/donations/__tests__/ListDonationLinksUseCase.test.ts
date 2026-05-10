import { describe, it, expect } from 'vitest';
import { ListDonationLinksUseCase } from '../ListDonationLinksUseCase';
import { FakeDonationLinksRepository, makeLink } from './fakeDonationLinksRepository';

describe('ListDonationLinksUseCase', () => {
  it('forwards the slug to the repository and returns the rows', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.listResult = [makeLink({ id: 'l_1' }), makeLink({ id: 'l_2' })];
    const uc = new ListDonationLinksUseCase(repo);

    const out = await uc.execute('food');

    expect(repo.lastListSlug).toBe('food');
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBe('l_1');
  });

  it('returns an empty array when the repository has no rows', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.listResult = [];
    const uc = new ListDonationLinksUseCase(repo);
    expect(await uc.execute('animals')).toEqual([]);
  });
});
