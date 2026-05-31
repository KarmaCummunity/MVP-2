// FR-RIDE-024 — list rides owned by the caller for the driver dashboard.
// Thin pass-through; ordering + grouping happen in the UI from `departs_at`.
import type {
  IRideListingRepository,
  ListMyRidesInput,
  RideListingRow,
} from '../ports/IRideListingRepository';

export class ListMyRidesUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: ListMyRidesInput): Promise<RideListingRow[]> {
    return this.repo.listMyRides(input);
  }
}
