import { describe, expect, it } from 'vitest';
import type { RideRating, UserRideRatingSummary } from '../RideRating';

// FR-RIDE-037..039 — rating entity + per-user aggregate.
//
// Both exports are compile-time-only interfaces (no runtime export). These
// tests pin their documented shape via typed construction (verified by
// `tsc --noEmit`), exercise the 1..5 stars range at both boundaries, and use
// `@ts-expect-error` to assert the type system rejects out-of-range stars and
// other malformed inputs.
describe('RideRating shape', () => {
  it('accepts a positive rating with a comment (happy path)', () => {
    const rating: RideRating = {
      ratingId: 'rat-1',
      rideId: 'ride-1',
      raterId: 'user-1',
      rateeId: 'user-2',
      stars: 5,
      comment: 'נהג מצוין',
      isPenalty: false,
      createdAt: '2026-05-31T12:00:00.000Z',
    };
    expect(rating.stars).toBe(5);
    expect(rating.isPenalty).toBe(false);
  });

  it('accepts the lower star boundary (1) with a NULL comment', () => {
    const rating: RideRating = {
      ratingId: 'rat-2',
      rideId: 'ride-1',
      raterId: 'user-1',
      rateeId: 'user-2',
      stars: 1,
      comment: null,
      isPenalty: true,
      createdAt: '2026-05-31T12:00:00.000Z',
    };
    expect(rating.stars).toBe(1);
    expect(rating.comment).toBeNull();
    expect(rating.isPenalty).toBe(true);
  });

  it('accepts every star value across the full 1..5 range', () => {
    const allStars: ReadonlyArray<RideRating['stars']> = [1, 2, 3, 4, 5];
    const ratings = allStars.map(
      (stars): RideRating => ({
        ratingId: `rat-${stars}`,
        rideId: 'ride-1',
        raterId: 'user-1',
        rateeId: 'user-2',
        stars,
        comment: null,
        isPenalty: false,
        createdAt: '2026-05-31T12:00:00.000Z',
      }),
    );
    expect(ratings.map((r) => r.stars)).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects 0 stars (below range) at the type level', () => {
    const rating: RideRating = {
      ratingId: 'rat-0',
      rideId: 'ride-1',
      raterId: 'user-1',
      rateeId: 'user-2',
      // @ts-expect-error — 0 is below the 1..5 range
      stars: 0,
      comment: null,
      isPenalty: false,
      createdAt: '2026-05-31T12:00:00.000Z',
    };
    expect(rating).toBeDefined();
  });

  it('rejects 6 stars (above range) at the type level', () => {
    const rating: RideRating = {
      ratingId: 'rat-6',
      rideId: 'ride-1',
      raterId: 'user-1',
      rateeId: 'user-2',
      // @ts-expect-error — 6 is above the 1..5 range
      stars: 6,
      comment: null,
      isPenalty: false,
      createdAt: '2026-05-31T12:00:00.000Z',
    };
    expect(rating).toBeDefined();
  });
});

describe('UserRideRatingSummary shape', () => {
  it('accepts a summary with prior ratings (happy path)', () => {
    const summary: UserRideRatingSummary = {
      userId: 'user-2',
      ratingsCount: 12,
      avgStars: 4.5,
      lastRatedAt: '2026-05-31T12:00:00.000Z',
    };
    expect(summary.ratingsCount).toBe(12);
    expect(summary.avgStars).toBeCloseTo(4.5);
  });

  it('accepts an empty summary with NULL lastRatedAt (boundary: no ratings yet)', () => {
    const summary: UserRideRatingSummary = {
      userId: 'user-3',
      ratingsCount: 0,
      avgStars: 0,
      lastRatedAt: null,
    };
    expect(summary.ratingsCount).toBe(0);
    expect(summary.lastRatedAt).toBeNull();
  });

  it('rejects a non-numeric ratingsCount at the type level', () => {
    const summary: UserRideRatingSummary = {
      userId: 'user-4',
      // @ts-expect-error — ratingsCount must be a number
      ratingsCount: 'many',
      avgStars: 0,
      lastRatedAt: null,
    };
    expect(summary).toBeDefined();
  });
});
