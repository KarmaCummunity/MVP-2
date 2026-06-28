// FR-RIDE-020 — owner updates visibility on an existing open ride.
import type { IRideListingRepository, RideListingRow, RideVisibility } from '../ports/IRideListingRepository';

export interface UpdateRideVisibilityInput {
  readonly rideId: string;
  readonly visibility: RideVisibility;
}

export class UpdateRideVisibilityUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: UpdateRideVisibilityInput): Promise<RideListingRow> {
    return this.repo.updateVisibility(input);
  }
}
