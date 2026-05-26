import type {
  ReportInboxPage, ReportInboxCursor, AdminReportTargetType, ReportCaseDetail,
} from '@kc/domain';

export interface ListOpenReportsFilters {
  readonly targetType?: AdminReportTargetType | null;
  readonly maxAgeDays?: number | null;
  readonly reporterId?: string | null;
}

export interface IReportsRepository {
  listOpenInbox(filters: ListOpenReportsFilters, cursor: ReportInboxCursor | null, limit: number): Promise<ReportInboxPage>;
  getCaseDetail(targetType: AdminReportTargetType, targetId: string): Promise<ReportCaseDetail | null>;
}
