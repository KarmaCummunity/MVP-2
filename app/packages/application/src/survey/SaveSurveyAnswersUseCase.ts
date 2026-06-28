import { SurveyError } from '@kc/domain';
import type { SurveyBundle, SurveyAnswerDraft } from '@kc/domain';
import type { ISurveyRepository } from '../ports/ISurveyRepository';

const MIN_RATING = 1;
const MAX_RATING = 7;

export interface SaveSurveyAnswersInput {
  readonly slug: string;
  readonly bundle: SurveyBundle;
  readonly answers: SurveyAnswerDraft[];
}

function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING;
}

function validateAnswers(bundle: SurveyBundle, answers: SurveyAnswerDraft[]): void {
  // Partial saves are intentional — the runner debounces save after each
  // answer change, so we routinely upsert before every question has a
  // rating (FR-SETTINGS-016 AC4). We only validate that:
  //   1. each provided answer's rating is in [1,7]
  //   2. each provided answer's question_id belongs to the bundle
  // We do NOT require every question to have an answer.
  const validQids = new Set(bundle.questions.map((q) => q.id));
  for (const answer of answers) {
    if (!validQids.has(answer.questionId)) {
      throw new SurveyError(
        'validation',
        `unknown_question_${answer.questionId}`,
      );
    }
    if (!isValidRating(answer.rating)) {
      throw new SurveyError(
        'validation',
        `invalid_rating_for_question_${answer.questionId}`,
      );
    }
  }
}

export class SaveSurveyAnswersUseCase {
  constructor(private readonly repo: ISurveyRepository) {}

  async execute(input: SaveSurveyAnswersInput): Promise<void> {
    validateAnswers(input.bundle, input.answers);
    await this.repo.upsertAnswers(input.slug, input.answers);
  }
}
