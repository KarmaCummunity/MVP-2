import { SurveyError } from '@kc/domain';
import type { ISurveyRepository } from '../ports/ISurveyRepository';

const MIN_BODY_LENGTH = 10;
const MAX_BODY_LENGTH = 500;
const MIN_RATING = 1;
const MAX_RATING = 7;

export interface SubmitFreeFeedbackInput {
  readonly rating: number | null;
  readonly body: string;
}

function validateBody(body: string): void {
  const trimmedLen = body.trim().length;
  if (trimmedLen < MIN_BODY_LENGTH) {
    throw new SurveyError('validation', 'body_too_short');
  }
  if (trimmedLen > MAX_BODY_LENGTH) {
    throw new SurveyError('validation', 'body_too_long');
  }
}

function validateRating(rating: number | null): void {
  if (rating === null) return;
  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    throw new SurveyError('validation', 'rating_out_of_range');
  }
}

export class SubmitFreeFeedbackUseCase {
  constructor(private readonly repo: ISurveyRepository) {}

  async execute(input: SubmitFreeFeedbackInput): Promise<void> {
    validateBody(input.body);
    validateRating(input.rating);
    await this.repo.submitFreeFeedback({ rating: input.rating, body: input.body });
  }
}
