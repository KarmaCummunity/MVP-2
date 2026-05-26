import type { IRideListingRepository, RideListingRow } from '../ports/IRideListingRepository';

export interface GetRideListingInput {
  rideId: string;
  viewerId: string;
}

export class GetRideListingUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: GetRideListingInput): Promise<RideListingRow | null> {
    return this.repo.getById(input.rideId, input.viewerId);
  }
}
