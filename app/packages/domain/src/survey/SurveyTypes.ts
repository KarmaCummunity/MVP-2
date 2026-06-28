/**
 * Survey domain value types — FR-SETTINGS-015..017.
 * Covers Survey A (`ux-experience`) and the shared question schema.
 * Zero dependencies on node_modules (besides typescript).
 */

export type SurveyCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export type SurveyQuestionType = 'rating_1_7_with_optional_text';

export interface SurveyListItem {
  readonly slug: string;
  readonly titleHe: string;
  readonly descriptionHe: string | null;
  readonly currentVersion: number;
  readonly completionStatus: SurveyCompletionStatus;
}

export interface SurveyQuestion {
  readonly id: string;
  readonly sortOrder: number;
  readonly questionType: SurveyQuestionType;
  readonly shortLabelHe: string;
  readonly promptHe: string;
  readonly contextHe: string;
  readonly textPlaceholderHe: string;
  readonly ratingAnchorLowHe: string;
  readonly ratingAnchorHighHe: string;
}

export interface SurveyAnswerDraft {
  readonly questionId: string;
  readonly rating: number;
  readonly answerText: string | null;
}

export interface SurveyBundle {
  readonly slug: string;
  readonly titleHe: string;
  readonly version: number;
  readonly questions: readonly SurveyQuestion[];
  readonly answers: readonly SurveyAnswerDraft[];
}

export interface SurveyPromptEligibility {
  readonly show: boolean;
  readonly slug: string;
}
