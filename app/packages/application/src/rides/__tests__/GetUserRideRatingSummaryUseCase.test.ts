// FR-RIDE-038 — GetUserRideRatingSummaryUseCase gates display on the privacy threshold.
import { describe, expect, it, vi } from 'vitest';
import type { UserRideRatingSummary } from '@kc/domain';
import {
  GetUserRideRatingSummaryUseCase,
  RATING_DISPLAY_MIN_COUNT,
} from '../GetUserRideRatingSummaryUseCase';
import type { IRideRatingRepository } from '../../ports/IRideRatingRepository';

const USER = '11111111-1111-4111-8111-111111111111';

function makeRepo(summary: UserRideRatingSummary | null): IRideRatingRepository {
  return {
    submit: vi.fn(),
    listForRide: vi.fn(),
    summaryFor: vi.fn().mockResolvedValue(summary),
  };
}

function makeSummary(count: number): UserRideRatingSummary {
  return { userId: USER, ratingsCount: count, avgStars: 4.5, lastRatedAt: '2026-05-30T00:00:00Z' };
}

describe('GetUserRideRatingSummaryUseCase', () => {
  it('exposes the privacy threshold as 3', () => {
    expect(RATING_DISPLAY_MIN_COUNT).toBe(3);
  });

  it('shouldDisplay is true at the threshold', async () => {
    const summary = makeSummary(RATING_DISPLAY_MIN_COUNT);
    const out = await new GetUserRideRatingSummaryUseCase(makeRepo(summary)).execute(USER);
    expect(out.summary).toEqual(summary);
    expect(out.shouldDisplay).toBe(true);
  });

  it('shouldDisplay is false below the threshold', async () => {
    const summary = makeSummary(RATING_DISPLAY_MIN_COUNT - 1);
    const out = await new GetUserRideRatingSummaryUseCase(makeRepo(summary)).execute(USER);
    expect(out.summary).toEqual(summary);
    expect(out.shouldDisplay).toBe(false);
  });

  it('shouldDisplay is false when no summary exists', async () => {
    const out = await new GetUserRideRatingSummaryUseCase(makeRepo(null)).execute(USER);
    expect(out.summary).toBeNull();
    expect(out.shouldDisplay).toBe(false);
  });

  it('forwards the userId to the repository', async () => {
    const repo = makeRepo(makeSummary(5));
    await new GetUserRideRatingSummaryUseCase(repo).execute(USER);
    expect(repo.summaryFor).toHaveBeenCalledWith(USER);
  });
});
