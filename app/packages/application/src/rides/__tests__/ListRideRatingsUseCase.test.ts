// FR-RIDE-037 — ListRideRatingsUseCase reads ratings for a ride.
import { describe, expect, it, vi } from 'vitest';
import type { RideRating } from '@kc/domain';
import { ListRideRatingsUseCase } from '../ListRideRatingsUseCase';
import type { IRideRatingRepository } from '../../ports/IRideRatingRepository';

function makeRating(id: string): RideRating {
  return {
    ratingId: id,
    rideId: 'ride-1',
    raterId: 'u_rater',
    rateeId: 'u_ratee',
    stars: 5,
    comment: null,
    isPenalty: false,
    createdAt: '2026-05-31T10:00:00Z',
  };
}

describe('ListRideRatingsUseCase', () => {
  it('returns the ratings the repo finds for the ride', async () => {
    const ratings = [makeRating('r1'), makeRating('r2')];
    const repo: IRideRatingRepository = {
      submit: vi.fn(),
      listForRide: vi.fn().mockResolvedValue(ratings),
      summaryFor: vi.fn(),
    };

    const out = await new ListRideRatingsUseCase(repo).execute('ride-1');

    expect(out).toEqual(ratings);
    expect(repo.listForRide).toHaveBeenCalledWith('ride-1');
  });

  it('returns an empty list when the ride has no ratings', async () => {
    const repo: IRideRatingRepository = {
      submit: vi.fn(),
      listForRide: vi.fn().mockResolvedValue([]),
      summaryFor: vi.fn(),
    };

    const out = await new ListRideRatingsUseCase(repo).execute('ride-x');

    expect(out).toEqual([]);
  });
});
