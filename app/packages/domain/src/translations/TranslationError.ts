import { DomainError } from '../errors';

/**
 * Raised when a translation operation violates a domain invariant (e.g. a
 * malformed request the pipeline cannot act on). `code` is the stable,
 * machine-readable discriminator used at the UI layer.
 */
export class TranslationError extends DomainError {
  readonly code = 'translation';
}
