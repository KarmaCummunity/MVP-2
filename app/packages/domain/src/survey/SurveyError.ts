/**
 * Survey domain error — FR-SETTINGS-015..017.
 * Thrown by use cases; caught at the UI layer and mapped to localized toasts.
 */

export type SurveyErrorCode = 'not_found' | 'inactive' | 'validation' | 'network';

export class SurveyError extends Error {
  readonly code: SurveyErrorCode;
  /** Machine-readable detail key (e.g. 'body_too_short', 'missing_rating_for_question_<id>'). */
  readonly detail: string | undefined;
  readonly cause?: unknown;

  constructor(
    code: SurveyErrorCode,
    detail?: string,
    opts: { cause?: unknown } = {},
  ) {
    super(detail ? `survey_error:${code}:${detail}` : `survey_error:${code}`);
    this.name = 'SurveyError';
    this.code = code;
    this.detail = detail;
    this.cause = opts.cause;
    Object.setPrototypeOf(this, SurveyError.prototype);
  }
}

export function isSurveyError(value: unknown): value is SurveyError {
  return value instanceof SurveyError;
}
