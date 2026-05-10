/** FR-MOD-001 — submit a report against a single post. Mirror of ReportChatUseCase. */
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';

export interface ReportPostInput {
  reporterId: string;
  postId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportPostUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportPostInput): Promise<void> {
    const submission: ReportSubmission = {
      targetType: 'post',
      targetId: input.postId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
