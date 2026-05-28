import { describe, it, expect, vi } from 'vitest';
import { SubmitFreeFeedbackUseCase } from '../SubmitFreeFeedbackUseCase';
import { SurveyError } from '@kc/domain';
import { makeFakeRepo } from './surveyFakeRepository';

describe('SubmitFreeFeedbackUseCase', () => {
  it('submits when body and rating are valid', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await uc.execute({ rating: 4, body: 'This is valid feedback text.' });

    expect(repo.submitFreeFeedback).toHaveBeenCalledWith({
      rating: 4,
      body: 'This is valid feedback text.',
    });
  });

  it('accepts rating=null (optional)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(
      uc.execute({ rating: null, body: 'Valid feedback here.' }),
    ).resolves.toBeUndefined();
  });

  it('accepts rating at the boundaries (1 and 7)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(uc.execute({ rating: 1, body: 'Valid feedback text.' })).resolves.toBeUndefined();
    await expect(uc.execute({ rating: 7, body: 'Valid feedback text.' })).resolves.toBeUndefined();
  });

  it('throws validation body_too_short when trimmed body < 10 chars', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(uc.execute({ rating: null, body: 'short' })).rejects.toMatchObject({
      code: 'validation',
      detail: 'body_too_short',
    });
    expect(repo.submitFreeFeedback).not.toHaveBeenCalled();
  });

  it('throws validation body_too_short for whitespace-only body', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(uc.execute({ rating: null, body: '          ' })).rejects.toMatchObject({
      code: 'validation',
      detail: 'body_too_short',
    });
  });

  it('throws validation body_too_long when trimmed body > 500 chars', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);
    const longBody = 'A'.repeat(501);

    await expect(uc.execute({ rating: null, body: longBody })).rejects.toMatchObject({
      code: 'validation',
      detail: 'body_too_long',
    });
  });

  it('throws validation rating_out_of_range when rating is 0', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(
      uc.execute({ rating: 0, body: 'Valid feedback text here.' }),
    ).rejects.toMatchObject({ code: 'validation', detail: 'rating_out_of_range' });
  });

  it('throws validation rating_out_of_range when rating is 8', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(
      uc.execute({ rating: 8, body: 'Valid feedback text here.' }),
    ).rejects.toMatchObject({ code: 'validation', detail: 'rating_out_of_range' });
  });

  it('propagates repo failure', async () => {
    const err = new Error('insert failed');
    const repo = makeFakeRepo({ submitFreeFeedback: vi.fn().mockRejectedValue(err) });
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(
      uc.execute({ rating: 5, body: 'Valid feedback text here.' }),
    ).rejects.toBe(err);
  });

  it('accepts body exactly at min boundary (10 chars trimmed)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(
      uc.execute({ rating: null, body: '1234567890' }),
    ).resolves.toBeUndefined();
  });

  it('accepts body exactly at max boundary (500 chars)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);
    const exactBody = 'A'.repeat(500);

    await expect(
      uc.execute({ rating: null, body: exactBody }),
    ).resolves.toBeUndefined();
  });

  it('throws SurveyError not isSurveyError-falsy for validation errors', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitFreeFeedbackUseCase(repo);

    await expect(uc.execute({ rating: null, body: 'hi' })).rejects.toBeInstanceOf(SurveyError);
  });
});
