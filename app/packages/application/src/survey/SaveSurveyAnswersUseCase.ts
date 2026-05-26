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
  const answerMap = new Map<string, SurveyAnswerDraft>();
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer);
  }

  for (const question of bundle.questions) {
    const answer = answerMap.get(question.id);
    if (answer === undefined || !isValidRating(answer.rating)) {
      throw new SurveyError(
        'validation',
        `missing_rating_for_question_${question.id}`,
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
