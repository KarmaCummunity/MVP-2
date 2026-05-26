import type { ReportInboxPage, ReportInboxCursor } from '@kc/domain';
import type { IReportsRepository, ListOpenReportsFilters } from './IReportsRepository';

const DEFAULT_LIMIT = 25;

export interface ListOpenReportsInput {
  readonly filters: ListOpenReportsFilters;
  readonly cursor: ReportInboxCursor | null;
  readonly limit?: number;
}

export class ListOpenReportsUseCase {
  constructor(private readonly repo: IReportsRepository) {}

  async execute(input: ListOpenReportsInput): Promise<ReportInboxPage> {
    return this.repo.listOpenInbox(input.filters, input.cursor, input.limit ?? DEFAULT_LIMIT);
  }
}
