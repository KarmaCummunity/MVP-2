export type ReportErrorCode =
  | 'invalid_target'
  | 'duplicate_within_24h'
  | 'target_already_moderated'
  | 'unknown';

export class ReportError extends Error {
  readonly code: ReportErrorCode;
  readonly cause?: unknown;
  constructor(code: ReportErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ReportError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, ReportError.prototype);
  }
}
