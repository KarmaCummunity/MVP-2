import { describe, it, expect, vi } from 'vitest';
import { AcceptLegalDocumentUseCase } from '../AcceptLegalDocumentUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';

const fakeRepo = (impl: Partial<ILegalDocumentRepository>): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn(),
  acceptVersion: vi.fn(),
  ...impl,
});

describe('AcceptLegalDocumentUseCase', () => {
  it('accepts and returns the acceptance id + timestamp', async () => {
    const ts = new Date('2026-05-24T10:00:00Z');
    const repo = fakeRepo({
      acceptVersion: vi.fn().mockResolvedValue({ acceptanceId: 'a1', acceptedAt: ts }),
    });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    const result = await useCase.execute({
      docType: 'terms',
      version: 3,
      locale: 'he',
      userAgent: 'iOS 17 / Expo',
    });

    expect(result).toEqual({ acceptanceId: 'a1', acceptedAt: ts });
    expect(repo.acceptVersion).toHaveBeenCalledWith({
      docType: 'terms',
      version: 3,
      locale: 'he',
      userAgent: 'iOS 17 / Expo',
    });
  });

  it('truncates user agent to 500 chars before calling the repo', async () => {
    const repo = fakeRepo({
      acceptVersion: vi.fn().mockResolvedValue({ acceptanceId: 'a1', acceptedAt: new Date() }),
    });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    const longUA = 'A'.repeat(1000);
    await useCase.execute({ docType: 'privacy', version: 1, locale: 'he', userAgent: longUA });

    const calledWith = (repo.acceptVersion as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(calledWith.userAgent.length).toBe(500);
  });

  it('propagates repo failure', async () => {
    const err = new Error('rpc rejected');
    const repo = fakeRepo({ acceptVersion: vi.fn().mockRejectedValue(err) });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    await expect(
      useCase.execute({ docType: 'terms', version: 1, locale: 'he', userAgent: 'ua' }),
    ).rejects.toBe(err);
  });
});
