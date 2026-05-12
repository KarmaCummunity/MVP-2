/** FR-MOD-007 — submit a report against a single user. */
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';
import { ModerationError } from './errors';

export interface ReportUserInput {
  reporterId: string;
  targetUserId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportUserUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportUserInput): Promise<void> {
    if (input.reporterId === input.targetUserId) {
      throw new ModerationError('cannot_report_self', 'cannot report yourself');
    }
    const submission: ReportSubmission = {
      targetType: 'user',
      targetId: input.targetUserId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
