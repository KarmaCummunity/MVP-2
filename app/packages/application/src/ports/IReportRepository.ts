import type { ReportSubmission } from '@kc/domain';

export interface IReportRepository {
  submit(reporterId: string, input: ReportSubmission): Promise<void>;
}
