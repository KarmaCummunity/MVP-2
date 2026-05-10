import { describe, it, expect } from 'vitest';
import { AddDonationLinkUseCase } from '../AddDonationLinkUseCase';
import { DonationLinkError } from '../errors';
import { FakeDonationLinksRepository, makeLink } from './fakeDonationLinksRepository';

describe('AddDonationLinkUseCase', () => {
  it('trims inputs and forwards to the repository', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.addResult = makeLink({ displayName: 'Latet' });
    const uc = new AddDonationLinkUseCase(repo);

    const out = await uc.execute({
      categorySlug: 'food',
      url: '  https://www.latet.org.il/  ',
      displayName: '  Latet  ',
      description: '  Food NGO  ',
    });

    expect(out.displayName).toBe('Latet');
    expect(repo.lastAddInput).toEqual({
      categorySlug: 'food',
      url: 'https://www.latet.org.il/',
      displayName: 'Latet',
      description: 'Food NGO',
    });
  });

  it('coerces an empty trimmed description to null', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new AddDonationLinkUseCase(repo);
    await uc.execute({
      categorySlug: 'food',
      url: 'https://example.org',
      displayName: 'Example',
      description: '   ',
    });
    expect(repo.lastAddInput?.description).toBeNull();
  });

  it('rejects URLs that do not start with http(s)', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new AddDonationLinkUseCase(repo);
    await expect(
      uc.execute({ categorySlug: 'food', url: 'ftp://example.org', displayName: 'Ex' }),
    ).rejects.toBeInstanceOf(DonationLinkError);
    await expect(
      uc.execute({ categorySlug: 'food', url: 'example.org', displayName: 'Ex' }),
    ).rejects.toMatchObject({ code: 'invalid_url' });
  });

  it('rejects display names shorter than 2 characters', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new AddDonationLinkUseCase(repo);
    await expect(
      uc.execute({ categorySlug: 'food', url: 'https://example.org', displayName: ' a ' }),
    ).rejects.toMatchObject({ code: 'invalid_input' });
  });

  it('rejects display names longer than 80 characters', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new AddDonationLinkUseCase(repo);
    await expect(
      uc.execute({
        categorySlug: 'food',
        url: 'https://example.org',
        displayName: 'a'.repeat(81),
      }),
    ).rejects.toMatchObject({ code: 'invalid_input' });
  });

  it('rejects descriptions longer than 280 characters', async () => {
    const repo = new FakeDonationLinksRepository();
    const uc = new AddDonationLinkUseCase(repo);
    await expect(
      uc.execute({
        categorySlug: 'food',
        url: 'https://example.org',
        displayName: 'Example',
        description: 'a'.repeat(281),
      }),
    ).rejects.toMatchObject({ code: 'invalid_input' });
  });

  it('propagates repository errors (e.g. unreachable / rate_limited)', async () => {
    const repo = new FakeDonationLinksRepository();
    repo.addError = new DonationLinkError('unreachable', 'Edge function: unreachable');
    const uc = new AddDonationLinkUseCase(repo);
    await expect(
      uc.execute({ categorySlug: 'food', url: 'https://example.org', displayName: 'Example' }),
    ).rejects.toMatchObject({ code: 'unreachable' });
  });
});
