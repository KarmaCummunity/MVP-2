/** FR-ADMIN-003 — dismiss a pending report. */
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';

export interface DismissReportInput {
  reportId: string;
}

export class DismissReportUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: DismissReportInput): Promise<void> {
    await this.repo.dismissReport(input.reportId);
  }
}
