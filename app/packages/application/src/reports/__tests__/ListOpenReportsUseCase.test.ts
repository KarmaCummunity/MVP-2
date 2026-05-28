import { describe, expect, it, vi } from 'vitest';
import { ListOpenReportsUseCase } from '../ListOpenReportsUseCase';
import type { IReportsRepository } from '../IReportsRepository';

function fakeRepo(): IReportsRepository {
  return {
    listOpenInbox: vi.fn().mockResolvedValue({ rows: [], nextCursor: null }),
    getCaseDetail: vi.fn(),
  };
}

describe('ListOpenReportsUseCase', () => {
  it('passes filters and cursor through, defaulting limit to 25', async () => {
    const repo = fakeRepo();
    const uc = new ListOpenReportsUseCase(repo);
    await uc.execute({ filters: { targetType: 'post' }, cursor: null });
    expect(repo.listOpenInbox).toHaveBeenCalledWith({ targetType: 'post' }, null, 25);
  });

  it('passes explicit limit', async () => {
    const repo = fakeRepo();
    const uc = new ListOpenReportsUseCase(repo);
    await uc.execute({ filters: {}, cursor: null, limit: 10 });
    expect(repo.listOpenInbox).toHaveBeenCalledWith({}, null, 10);
  });
});
