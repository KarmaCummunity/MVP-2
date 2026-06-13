// FR-RIDE-031 + FR-RIDE-045 AC4 — owner marks arrival (optionally with breakdown reason).
import type { IRideListingRepository, RideListingRow } from '../ports/IRideListingRepository';

export interface ArriveRideInput {
  rideId: string;
  reason?: 'arrived' | 'breakdown';
}

export class ArriveRideUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: ArriveRideInput): Promise<RideListingRow> {
    return this.repo.arrive(input.rideId, input.reason ?? 'arrived');
  }
}
