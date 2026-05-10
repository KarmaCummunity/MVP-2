export type DonationLinkErrorCode =
  | 'invalid_input'
  | 'invalid_url'
  | 'unreachable'
  | 'rate_limited'
  | 'unauthorized'
  | 'network'
  | 'unknown';

export class DonationLinkError extends Error {
  readonly code: DonationLinkErrorCode;
  readonly cause?: unknown;
  constructor(code: DonationLinkErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DonationLinkError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, DonationLinkError.prototype);
  }
}
