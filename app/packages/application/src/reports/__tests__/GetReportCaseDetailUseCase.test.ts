import { describe, expect, it, vi } from 'vitest';
import type { ReportCaseDetail } from '@kc/domain';
import { GetReportCaseDetailUseCase } from '../GetReportCaseDetailUseCase';
import type { IReportsRepository } from '../IReportsRepository';

function fakeRepo(detail: ReportCaseDetail | null): IReportsRepository {
  return {
    listOpenInbox: vi.fn(),
    getCaseDetail: vi.fn().mockResolvedValue(detail),
  };
}

describe('GetReportCaseDetailUseCase', () => {
  it('returns the repo result', async () => {
    const detail: ReportCaseDetail = {
      targetType: 'post', targetId: 'abc',
      target: { preview: 'hi' }, reporters: [], timeline: [],
    };
    const uc = new GetReportCaseDetailUseCase(fakeRepo(detail));
    expect(await uc.execute('post', 'abc')).toEqual(detail);
  });

  it('returns null when the case does not exist', async () => {
    const uc = new GetReportCaseDetailUseCase(fakeRepo(null));
    expect(await uc.execute('post', 'abc')).toBeNull();
  });
});
