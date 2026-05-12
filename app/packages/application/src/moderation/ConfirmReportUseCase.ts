/** FR-ADMIN-003 — confirm a pending report. */
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';

export interface ConfirmReportInput {
  reportId: string;
}

export class ConfirmReportUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: ConfirmReportInput): Promise<void> {
    await this.repo.confirmReport(input.reportId);
  }
}
