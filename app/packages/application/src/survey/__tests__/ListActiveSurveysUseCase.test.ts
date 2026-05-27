import { describe, it, expect, vi } from 'vitest';
import { ListActiveSurveysUseCase } from '../ListActiveSurveysUseCase';
import { makeFakeRepo, makeListItem } from './surveyFakeRepository';

describe('ListActiveSurveysUseCase', () => {
  it('returns the list from the repo', async () => {
    const items = [makeListItem(), makeListItem({ slug: 'other-survey' })];
    const repo = makeFakeRepo({ listActive: vi.fn().mockResolvedValue(items) });
    const uc = new ListActiveSurveysUseCase(repo);

    const result = await uc.execute();

    expect(result).toEqual(items);
    expect(repo.listActive).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when no surveys are active', async () => {
    const repo = makeFakeRepo({ listActive: vi.fn().mockResolvedValue([]) });
    const uc = new ListActiveSurveysUseCase(repo);

    const result = await uc.execute();

    expect(result).toEqual([]);
  });

  it('propagates repo failure', async () => {
    const err = new Error('network error');
    const repo = makeFakeRepo({ listActive: vi.fn().mockRejectedValue(err) });
    const uc = new ListActiveSurveysUseCase(repo);

    await expect(uc.execute()).rejects.toBe(err);
  });

  it('returns items with all expected fields', async () => {
    const item = makeListItem({
      completionStatus: 'in_progress',
      currentVersion: 3,
      descriptionHe: 'תיאור',
    });
    const repo = makeFakeRepo({ listActive: vi.fn().mockResolvedValue([item]) });
    const uc = new ListActiveSurveysUseCase(repo);

    const [first] = await uc.execute();
    expect(first?.completionStatus).toBe('in_progress');
    expect(first?.currentVersion).toBe(3);
    expect(first?.descriptionHe).toBe('תיאור');
  });
});
