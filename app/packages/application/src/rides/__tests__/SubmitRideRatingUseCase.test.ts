// FR-RIDE-037 — SubmitRideRatingUseCase validates stars and comment length.
import { describe, expect, it, vi } from 'vitest';
import type { RideRating } from '@kc/domain';
import { SubmitRideRatingUseCase } from '../SubmitRideRatingUseCase';
import type {
  IRideRatingRepository,
  SubmitRideRatingInput,
} from '../../ports/IRideRatingRepository';

function makeRepo(): { repo: IRideRatingRepository; submit: ReturnType<typeof vi.fn> } {
  const submit = vi.fn(
    async (input: SubmitRideRatingInput): Promise<RideRating> => ({
      ratingId: 'r1',
      rideId: input.rideId,
      raterId: 'u_rater',
      rateeId: input.rateeId,
      stars: input.stars,
      comment: input.comment,
      isPenalty: input.isPenalty ?? false,
      createdAt: '2026-05-31T10:00:00Z',
    }),
  );
  return { repo: { submit, listForRide: vi.fn(), summaryFor: vi.fn() }, submit };
}

function baseInput(over: Partial<SubmitRideRatingInput> = {}): SubmitRideRatingInput {
  return { rideId: 'ride-1', rateeId: 'u_ratee', stars: 5, comment: null, ...over };
}

describe('SubmitRideRatingUseCase', () => {
  it('submits a valid rating and returns the row', async () => {
    const { repo, submit } = makeRepo();
    const input = baseInput({ stars: 4, comment: 'great ride' });
    const out = await new SubmitRideRatingUseCase(repo).execute(input);
    expect(out.stars).toBe(4);
    expect(out.comment).toBe('great ride');
    expect(submit).toHaveBeenCalledWith(input);
  });

  it('accepts the boundary star values 1 and 5', async () => {
    const { repo } = makeRepo();
    const uc = new SubmitRideRatingUseCase(repo);
    await expect(uc.execute(baseInput({ stars: 1 }))).resolves.toBeDefined();
    await expect(uc.execute(baseInput({ stars: 5 }))).resolves.toBeDefined();
  });

  it('rejects stars below 1', async () => {
    const { repo, submit } = makeRepo();
    await expect(
      new SubmitRideRatingUseCase(repo).execute(baseInput({ stars: 0 as 1 })),
    ).rejects.toMatchObject({ code: 'rating_window_closed' });
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects stars above 5', async () => {
    const { repo } = makeRepo();
    await expect(
      new SubmitRideRatingUseCase(repo).execute(baseInput({ stars: 6 as 5 })),
    ).rejects.toMatchObject({ code: 'rating_window_closed' });
  });

  it('accepts a comment of exactly 300 characters', async () => {
    const { repo } = makeRepo();
    const out = await new SubmitRideRatingUseCase(repo).execute(
      baseInput({ comment: 'a'.repeat(300) }),
    );
    expect(out.comment).toHaveLength(300);
  });

  it('rejects a comment longer than 300 characters', async () => {
    const { repo, submit } = makeRepo();
    await expect(
      new SubmitRideRatingUseCase(repo).execute(baseInput({ comment: 'a'.repeat(301) })),
    ).rejects.toMatchObject({ code: 'description_too_long' });
    expect(submit).not.toHaveBeenCalled();
  });
});
