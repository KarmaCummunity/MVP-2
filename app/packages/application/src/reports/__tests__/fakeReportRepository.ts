import type { IReportRepository } from '../../ports/IReportRepository';
import type { ReportSubmission } from '@kc/domain';

export class FakeReportRepository implements IReportRepository {
  lastSubmit: { reporterId: string; input: ReportSubmission } | null = null;
  submitError: Error | null = null;

  submit = async (reporterId: string, input: ReportSubmission): Promise<void> => {
    this.lastSubmit = { reporterId, input };
    if (this.submitError) throw this.submitError;
  };
}
