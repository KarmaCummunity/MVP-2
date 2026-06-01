import { describe, it, expect, vi } from 'vitest';
import { SubmitPublicResearchResponseUseCase } from '../SubmitPublicResearchResponseUseCase';
import { PublicResearchError } from '@kc/domain';
import {
  makeFakeRepo,
  makeSubmission,
  makeSubmitResult,
} from './publicResearchFakeRepository';

describe('SubmitPublicResearchResponseUseCase', () => {
  it('returns submit result on happy path', async () => {
    const result = makeSubmitResult({ responseId: 'resp-abc' });
    const repo = makeFakeRepo({ submit: vi.fn().mockResolvedValue(result) });
    const uc = new SubmitPublicResearchResponseUseCase(repo);

    const output = await uc.execute(makeSubmission());

    expect(output).toEqual(result);
    expect(repo.submit).toHaveBeenCalledOnce();
  });

  it('throws validation error for rating below range (0)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ answers: [{ questionId: 'q1', rating: 0, answerText: null }] });

    await expect(uc.execute(payload)).rejects.toMatchObject({
      code: 'validation',
      detail: 'invalid_rating_for_question_q1',
    });
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it('throws validation error for rating above range (8)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ answers: [{ questionId: 'q1', rating: 8, answerText: null }] });

    await expect(uc.execute(payload)).rejects.toMatchObject({
      code: 'validation',
      detail: 'invalid_rating_for_question_q1',
    });
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it('accepts rating at lower boundary (1)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ answers: [{ questionId: 'q1', rating: 1, answerText: null }] });

    await expect(uc.execute(payload)).resolves.toBeDefined();
  });

  it('accepts rating at upper boundary (7)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ answers: [{ questionId: 'q1', rating: 7, answerText: null }] });

    await expect(uc.execute(payload)).resolves.toBeDefined();
  });

  it('throws validation error for invalid source format', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ source: 'INVALID SOURCE!' });

    await expect(uc.execute(payload)).rejects.toMatchObject({
      code: 'validation',
      detail: 'invalid_source_format',
    });
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it('throws validation error for invalid email when contactEmail is provided', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ contactEmail: 'not-an-email' });

    await expect(uc.execute(payload)).rejects.toMatchObject({
      code: 'validation',
      detail: 'invalid_email',
    });
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it('accepts valid contactEmail', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ contactEmail: 'user@example.com' });

    await expect(uc.execute(payload)).resolves.toBeDefined();
  });

  it('throws validation error when contactWindowHe exceeds 200 characters', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ contactWindowHe: 'א'.repeat(201) });

    await expect(uc.execute(payload)).rejects.toMatchObject({
      code: 'validation',
      detail: 'contact_window_too_long',
    });
    expect(repo.submit).not.toHaveBeenCalled();
  });

  it('calls repo.submit when honeypot is non-empty (server decides silently)', async () => {
    const repo = makeFakeRepo();
    const uc = new SubmitPublicResearchResponseUseCase(repo);
    const payload = makeSubmission({ honeypot: 'bot-fill' });

    await uc.execute(payload);

    // Honeypot is NOT client-gated — the server handles silent success.
    expect(repo.submit).toHaveBeenCalledWith(payload);
  });

  it('propagates PublicResearchError rate_limited from repo', async () => {
    const repo = makeFakeRepo({
      submit: vi.fn().mockRejectedValue(new PublicResearchError('rate_limited')),
    });
    const uc = new SubmitPublicResearchResponseUseCase(repo);

    await expect(uc.execute(makeSubmission())).rejects.toMatchObject({
      code: 'rate_limited',
    });
  });

  it('wraps unknown repo error as PublicResearchError network', async () => {
    const repo = makeFakeRepo({
      submit: vi.fn().mockRejectedValue(new Error('db write failed')),
    });
    const uc = new SubmitPublicResearchResponseUseCase(repo);

    await expect(uc.execute(makeSubmission())).rejects.toMatchObject({
      code: 'network',
    });
  });
});
