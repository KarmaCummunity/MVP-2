export type BlockErrorCode = 'self_block_forbidden' | 'unknown';

export class BlockError extends Error {
  readonly code: BlockErrorCode;
  readonly cause?: unknown;
  constructor(code: BlockErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'BlockError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, BlockError.prototype);
  }
}
