/**
 * Public-research domain error — FR-RESEARCH-001..003.
 * Thrown by use cases; caught at the UI layer and mapped to localized toasts.
 */

export type PublicResearchErrorCode =
  | 'survey_not_found'
  | 'version_mismatch'
  | 'rate_limited'
  | 'honeypot_tripped'
  | 'circuit_open'
  | 'validation'
  | 'network';

export class PublicResearchError extends Error {
  readonly code: PublicResearchErrorCode;
  /** Machine-readable detail key (e.g. 'invalid_rating_for_question_<id>'). */
  readonly detail: string | undefined;
  readonly cause?: unknown;

  constructor(
    code: PublicResearchErrorCode,
    detail?: string,
    opts: { cause?: unknown } = {},
  ) {
    super(detail ? `public_research_error:${code}:${detail}` : `public_research_error:${code}`);
    this.name = 'PublicResearchError';
    this.code = code;
    this.detail = detail;
    this.cause = opts.cause;
    Object.setPrototypeOf(this, PublicResearchError.prototype);
  }
}

export function isPublicResearchError(value: unknown): value is PublicResearchError {
  return value instanceof PublicResearchError;
}
