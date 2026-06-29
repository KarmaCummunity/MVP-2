import type {
  AdminSurveyOverviewItem,
  AdminSurveyResults,
  AdminFeedbackEntry,
} from '@kc/domain';

/**
 * Read-only port for the Admin Portal survey dashboard (FR-ADMIN-021).
 * Backed by security-definer RPCs gated to super_admin / moderator.
 */
export interface ISurveyAdminRepository {
  /** Lists published surveys with response/respondent counts. */
  listOverview(): Promise<AdminSurveyOverviewItem[]>;

  /** Per-question statistics + per-user answers for a survey's current version. */
  getResults(slug: string): Promise<AdminSurveyResults>;

  /** Paginated free-text feedback with submitter display name. */
  listFeedback(limit: number, offset: number): Promise<AdminFeedbackEntry[]>;
}
