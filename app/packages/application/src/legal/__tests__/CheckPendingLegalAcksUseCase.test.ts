import { describe, it, expect, vi } from 'vitest';
import { CheckPendingLegalAcksUseCase } from '../CheckPendingLegalAcksUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';
import type { LegalPendingItem } from '@kc/domain';

const item = (overrides: Partial<LegalPendingItem> = {}): LegalPendingItem => ({
  docType: 'terms',
  currentVersion: 2,
  currentEffectiveDate: new Date('2026-05-20T00:00:00Z'),
  lastAcceptedVersion: 0,
  severity: 'standard',
  blockMode: 'banner',
  ...overrides,
});

const fakeRepo = (pending: LegalPendingItem[]): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn().mockResolvedValue(pending),
  acceptVersion: vi.fn(),
});

describe('CheckPendingLegalAcksUseCase', () => {
  it('returns an empty result when nothing is pending', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(fakeRepo([]));
    const result = await useCase.execute();
    expect(result.pending).toEqual([]);
    expect(result.mustBlockImmediately).toBe(false);
  });

  it('orders terms before privacy', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([item({ docType: 'privacy' }), item({ docType: 'terms' })]),
    );
    const result = await useCase.execute();
    expect(result.pending.map((p) => p.docType)).toEqual(['terms', 'privacy']);
  });

  it('dedupes by docType, keeping the first occurrence', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([
        item({ docType: 'terms', currentVersion: 2 }),
        item({ docType: 'terms', currentVersion: 99 }),
      ]),
    );
    const result = await useCase.execute();
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0]!.currentVersion).toBe(2);
  });

  it('flags mustBlockImmediately when any item is modal', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([item({ docType: 'terms', blockMode: 'modal' })]),
    );
    const result = await useCase.execute();
    expect(result.mustBlockImmediately).toBe(true);
  });
});
