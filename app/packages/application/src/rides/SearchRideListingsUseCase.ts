import type { IRideListingRepository, RideListingRow, SearchRideListingsInput } from '../ports/IRideListingRepository';
import type { IRideMatchScorer } from './ports/IRideMatchScorer';
import { ChronologicalRideMatchScorer } from './ChronologicalRideMatchScorer';

export class SearchRideListingsUseCase {
  constructor(
    private readonly repo: IRideListingRepository,
    private readonly scorer: IRideMatchScorer = new ChronologicalRideMatchScorer(),
  ) {}

  async execute(input: SearchRideListingsInput): Promise<RideListingRow[]> {
    const rows = await this.repo.search(input);
    return this.scorer.sort(rows);
  }
}
