/** FR-CHAT-010 — submit a report against an entire chat thread. */
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';

export interface ReportChatInput {
  reporterId: string;
  chatId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportChatUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportChatInput): Promise<void> {
    const submission: ReportSubmission = {
      targetType: 'chat',
      targetId: input.chatId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
