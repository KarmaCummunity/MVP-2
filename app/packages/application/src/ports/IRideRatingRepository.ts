// FR-RIDE-037..038 — port for ride ratings.
import type { RideRating, UserRideRatingSummary } from '@kc/domain';

export interface SubmitRideRatingInput {
  rideId: string;
  rateeId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  /** FR-RIDE-039 — forced 1-star penalty for late cancellations / owner cancel. */
  isPenalty?: boolean;
}

export interface IRideRatingRepository {
  /** Caller submits a rating about `rateeId` for `rideId`. */
  submit(input: SubmitRideRatingInput): Promise<RideRating>;

  /** Ratings for a ride, visible to the caller via RLS. */
  listForRide(rideId: string): Promise<readonly RideRating[]>;

  /** Aggregate summary for a user. Returns NULL when no ratings exist. */
  summaryFor(userId: string): Promise<UserRideRatingSummary | null>;
}
