import { describe, it, expect, vi } from 'vitest';
import { SaveSurveyAnswersUseCase } from '../SaveSurveyAnswersUseCase';
import { SurveyError } from '@kc/domain';
import { makeFakeRepo, makeBundle, makeAnswer, makeQuestion } from './surveyFakeRepository';

describe('SaveSurveyAnswersUseCase', () => {
  it('calls upsertAnswers with slug and answers when all ratings are valid', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ questionId: 'q1', rating: 5 })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await uc.execute({ slug: 'ux-experience', bundle, answers });

    expect(repo.upsertAnswers).toHaveBeenCalledWith('ux-experience', answers);
  });

  it('accepts rating at the lower boundary (1)', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 1 })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).resolves.toBeUndefined();
  });

  it('accepts rating at the upper boundary (7)', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 7 })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).resolves.toBeUndefined();
  });

  it('throws SurveyError validation when a question has no matching answer', async () => {
    const q2 = makeQuestion({ id: 'q2', sortOrder: 2 });
    const bundle = makeBundle({ questions: [makeQuestion(), q2] });
    const answers = [makeAnswer({ questionId: 'q1', rating: 4 })]; // q2 missing
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).rejects.toMatchObject({
      code: 'validation',
      detail: 'missing_rating_for_question_q2',
    });
    expect(repo.upsertAnswers).not.toHaveBeenCalled();
  });

  it('throws SurveyError validation when rating is out of range (0)', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 0 })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('throws SurveyError validation when rating is out of range (8)', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 8 })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('propagates repo failure without wrapping', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 3 })];
    const repoErr = new Error('db write failed');
    const repo = makeFakeRepo({ upsertAnswers: vi.fn().mockRejectedValue(repoErr) });
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).rejects.toBe(repoErr);
  });

  it('accepts optional answerText as null', async () => {
    const bundle = makeBundle();
    const answers = [makeAnswer({ rating: 6, answerText: null })];
    const repo = makeFakeRepo();
    const uc = new SaveSurveyAnswersUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', bundle, answers })).resolves.toBeUndefined();
  });
});
