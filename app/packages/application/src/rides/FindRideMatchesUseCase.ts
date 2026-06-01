// FR-RIDE-014 — inverse-mode matches around the source ride's departure time.
//
// Drives the future "matches for your ride" surface and any same-day pairing
// hint we want to add to the ride detail screen.
import type { FindRideMatchesInput, IRideListingRepository, RideListingRow } from '../ports/IRideListingRepository';

export class FindRideMatchesUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: FindRideMatchesInput): Promise<RideListingRow[]> {
    return this.repo.findMatches(input);
  }
}
