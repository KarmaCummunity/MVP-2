import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IReportsRepository, ListOpenReportsFilters,
} from '@kc/application';
import {
  type ReportInboxCursor, type ReportInboxPage,
  type ReportCaseDetail, type AdminReportTargetType,
  parseReportInboxPage, parseReportCaseDetail,
} from '@kc/domain';

const EMPTY_PAGE: ReportInboxPage = { rows: [], nextCursor: null };

export class SupabaseReportsRepository implements IReportsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listOpenInbox(
    filters: ListOpenReportsFilters,
    cursor: ReportInboxCursor | null,
    limit: number,
  ): Promise<ReportInboxPage> {
    const cursorPayload = cursor === null ? null : {
      oldest_at: cursor.oldestAt,
      target_type: cursor.targetType,
      target_id: cursor.targetId,
    };
    const { data, error } = await this.client.rpc('reports_open_inbox', {
      p_target_type_filter: filters.targetType ?? null,
      p_max_age_days:       filters.maxAgeDays ?? null,
      p_reporter_filter:    filters.reporterId ?? null,
      p_cursor:             cursorPayload,
      p_limit:              limit,
    });
    if (error) return EMPTY_PAGE;
    return parseReportInboxPage(data);
  }

  async getCaseDetail(
    targetType: AdminReportTargetType,
    targetId: string,
  ): Promise<ReportCaseDetail | null> {
    const { data, error } = await this.client.rpc('reports_case_detail', {
      p_target_type: targetType,
      p_target_id:   targetId,
    });
    if (error) return null;
    return parseReportCaseDetail(data);
  }
}
