// FR-RIDE-031 — owner starts an open ride within the 30-min check-in window.
import type { IRideListingRepository, RideListingRow } from '../ports/IRideListingRepository';

export class StartRideUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(rideId: string): Promise<RideListingRow> {
    return this.repo.start(rideId);
  }
}
