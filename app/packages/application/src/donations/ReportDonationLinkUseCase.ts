import type { IDonationLinksRepository } from '../ports/IDonationLinksRepository';

export interface ReportDonationLinkInput {
  readonly linkId: string;
}

export class ReportDonationLinkUseCase {
  constructor(private readonly repo: IDonationLinksRepository) {}

  async execute(input: ReportDonationLinkInput): Promise<void> {
    await this.repo.report(input.linkId);
  }
}
