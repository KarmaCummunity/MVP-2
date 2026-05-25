import { describe, it, expect, vi } from 'vitest';
import { LoadLegalDocumentUseCase } from '../LoadLegalDocumentUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';
import type { LegalDocumentContent } from '@kc/domain';

const sample: LegalDocumentContent = {
  docType: 'terms',
  version: 3,
  effectiveDate: new Date('2026-05-24T00:00:00Z'),
  bodyMd: '# Terms',
  contentHash: 'abc123',
  severity: 'standard',
  changeSummary: '- thing 1',
  publishedAt: new Date('2026-05-24T00:00:00Z'),
};

const fakeRepo = (impl: Partial<ILegalDocumentRepository>): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn(),
  acceptVersion: vi.fn(),
  ...impl,
});

describe('LoadLegalDocumentUseCase', () => {
  it('returns content for the requested doc type', async () => {
    const repo = fakeRepo({ getCurrentContent: vi.fn().mockResolvedValue(sample) });
    const useCase = new LoadLegalDocumentUseCase(repo);

    const result = await useCase.execute({ docType: 'terms' });

    expect(result).toEqual(sample);
    expect(repo.getCurrentContent).toHaveBeenCalledWith('terms');
  });

  it('propagates repository errors unchanged', async () => {
    const err = new Error('network');
    const repo = fakeRepo({ getCurrentContent: vi.fn().mockRejectedValue(err) });
    const useCase = new LoadLegalDocumentUseCase(repo);

    await expect(useCase.execute({ docType: 'privacy' })).rejects.toBe(err);
  });
});
