/**
 * SubmitPublicResearchResponseUseCase — FR-RESEARCH-003.
 * Validates and submits an anonymous public research response.
 *
 * Validation rules (client-side guard; server enforces all rules authoritatively):
 * - Each answer's rating must be an integer in [1, 7].
 * - source must match ^[a-z0-9_-]{1,32}$.
 * - contactEmail (when present) must match a basic email pattern.
 * - contactWindowHe (when present) must be ≤ 200 characters.
 * - honeypot: passed through to the server unchanged (silent gate, FR-RESEARCH-002 AC1).
 */

import { PublicResearchError } from '@kc/domain';
import type { PublicResearchSubmission, PublicResearchSubmitResult } from '@kc/domain';
import type { IPublicResearchRepository } from '../ports/IPublicResearchRepository';

const MIN_RATING = 1;
const MAX_RATING = 7;
const SOURCE_REGEX = /^[a-z0-9_-]{1,32}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_CONTACT_WINDOW_LENGTH = 200;

function validateRatings(payload: PublicResearchSubmission): void {
  for (const answer of payload.answers) {
    const { rating, questionId } = answer;
    const valid = Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING;
    if (!valid) {
      throw new PublicResearchError(
        'validation',
        `invalid_rating_for_question_${questionId}`,
      );
    }
  }
}

function validateSource(source: string): void {
  if (!SOURCE_REGEX.test(source)) {
    throw new PublicResearchError('validation', 'invalid_source_format');
  }
}

function validateContactEmail(email: string | null): void {
  if (email !== null && !EMAIL_REGEX.test(email)) {
    throw new PublicResearchError('validation', 'invalid_email');
  }
}

function validateContactWindow(contactWindowHe: string | null): void {
  if (contactWindowHe !== null && contactWindowHe.length > MAX_CONTACT_WINDOW_LENGTH) {
    throw new PublicResearchError('validation', 'contact_window_too_long');
  }
}

export class SubmitPublicResearchResponseUseCase {
  constructor(private readonly repo: IPublicResearchRepository) {}

  async execute(payload: PublicResearchSubmission): Promise<PublicResearchSubmitResult> {
    validateRatings(payload);
    validateSource(payload.source);
    validateContactEmail(payload.contactEmail);
    validateContactWindow(payload.contactWindowHe);

    try {
      return await this.repo.submit(payload);
    } catch (err) {
      if (err instanceof PublicResearchError) throw err;
      throw new PublicResearchError('network', undefined, { cause: err });
    }
  }
}
