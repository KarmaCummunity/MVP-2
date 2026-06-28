import { describe, it, expect, vi } from 'vitest';
import { CheckSurveyPromptUseCase } from '../CheckSurveyPromptUseCase';
import { makeFakeRepo, makeEligibility } from './surveyFakeRepository';

describe('CheckSurveyPromptUseCase', () => {
  it('returns eligibility from the repo', async () => {
    const eligibility = makeEligibility({ show: true, slug: 'ux-experience' });
    const repo = makeFakeRepo({
      checkPromptEligibility: vi.fn().mockResolvedValue(eligibility),
    });
    const uc = new CheckSurveyPromptUseCase(repo);

    const result = await uc.execute({ slug: 'ux-experience', sessionCount: 5 });

    expect(result).toEqual(eligibility);
  });

  it('passes slug and sessionCount to the repo', async () => {
    const repo = makeFakeRepo();
    const uc = new CheckSurveyPromptUseCase(repo);

    await uc.execute({ slug: 'ux-experience', sessionCount: 10 });

    expect(repo.checkPromptEligibility).toHaveBeenCalledWith('ux-experience', 10);
  });

  it('returns show=false when repo says not eligible', async () => {
    const repo = makeFakeRepo({
      checkPromptEligibility: vi.fn().mockResolvedValue(
        makeEligibility({ show: false }),
      ),
    });
    const uc = new CheckSurveyPromptUseCase(repo);

    const result = await uc.execute({ slug: 'ux-experience', sessionCount: 1 });

    expect(result.show).toBe(false);
  });

  it('propagates repo failure', async () => {
    const err = new Error('rpc error');
    const repo = makeFakeRepo({
      checkPromptEligibility: vi.fn().mockRejectedValue(err),
    });
    const uc = new CheckSurveyPromptUseCase(repo);

    await expect(uc.execute({ slug: 'ux-experience', sessionCount: 3 })).rejects.toBe(err);
  });

  it('passes sessionCount=0 when first session', async () => {
    const repo = makeFakeRepo();
    const uc = new CheckSurveyPromptUseCase(repo);

    await uc.execute({ slug: 'ux-experience', sessionCount: 0 });

    expect(repo.checkPromptEligibility).toHaveBeenCalledWith('ux-experience', 0);
  });
});
