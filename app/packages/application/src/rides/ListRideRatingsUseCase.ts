// FR-RIDE-037 — list ratings for a ride.
import type { RideRating } from '@kc/domain';
import type { IRideRatingRepository } from '../ports/IRideRatingRepository';

export class ListRideRatingsUseCase {
  constructor(private readonly repo: IRideRatingRepository) {}

  async execute(rideId: string): Promise<readonly RideRating[]> {
    return this.repo.listForRide(rideId);
  }
}
