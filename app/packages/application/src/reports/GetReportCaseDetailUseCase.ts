import type { ReportCaseDetail, AdminReportTargetType } from '@kc/domain';
import type { IReportsRepository } from './IReportsRepository';

export class GetReportCaseDetailUseCase {
  constructor(private readonly repo: IReportsRepository) {}

  async execute(targetType: AdminReportTargetType, targetId: string): Promise<ReportCaseDetail | null> {
    return this.repo.getCaseDetail(targetType, targetId);
  }
}
