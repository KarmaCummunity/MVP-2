import type {
  SurveyBundle,
  SurveyAnswerDraft,
  SurveyListItem,
  SurveyPromptEligibility,
} from '@kc/domain';

export interface ISurveyRepository {
  /** Returns all surveys that are currently active. */
  listActive(): Promise<SurveyListItem[]>;

  /**
   * Loads the full survey bundle (questions + caller's existing answers)
   * for the given slug.
   */
  getBundle(slug: string): Promise<SurveyBundle>;

  /**
   * Persists (upserts) the caller's answers for the given survey slug.
   * Server enforces `(user_id, survey_id, version, question_id)` uniqueness.
   */
  upsertAnswers(slug: string, answers: SurveyAnswerDraft[]): Promise<void>;

  /**
   * Returns whether the prompt banner should be shown for the given slug.
   * `clientSessionCount` is passed by the client (V1; document as TD: spoofable).
   */
  checkPromptEligibility(
    slug: string,
    clientSessionCount: number,
  ): Promise<SurveyPromptEligibility>;

  /** Submits a free-text feedback entry to `user_feedback`. */
  submitFreeFeedback(input: { rating: number | null; body: string }): Promise<void>;
}
