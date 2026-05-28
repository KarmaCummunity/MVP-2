// Analytics — V1 stub (no-op in production; console.log in __DEV__).
// FR-SETTINGS-016 AC6: survey + feedback events.
// TD-161: Wire to a real analytics backend (first-party ingest per SRS §6.1).
// Properties must be PII-free: slug, version, question_index only.

export type SurveyAnalyticsEvent =
  | 'survey_opened'
  | 'survey_question_answered'
  | 'survey_completed'
  | 'survey_prompt_snoozed'
  | 'feedback_submitted';

type AnalyticsEvent = SurveyAnalyticsEvent;

type EventProperties = Record<string, unknown>;

/**
 * Emit a product analytics event.
 * V1: logs to console in __DEV__, no-ops in production.
 * Never include PII — only slugs, version numbers, and indices.
 */
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, properties ?? {});
  }
  // Production: send to /analytics/ingest Edge Function (TD-161).
}
