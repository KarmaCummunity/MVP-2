import type { IRideListingRepository } from '../ports/IRideListingRepository';

export interface CloseRideListingInput {
  rideId: string;
  ownerId: string;
  status: 'closed' | 'cancelled';
}

export class CloseRideListingUseCase {
  constructor(private readonly repo: IRideListingRepository) {}

  async execute(input: CloseRideListingInput): Promise<void> {
    const row = await this.repo.getById(input.rideId, input.ownerId);
    if (!row || row.ownerId !== input.ownerId) {
      throw new Error('ride_not_found_or_forbidden');
    }
    await this.repo.close(input.rideId, input.ownerId, input.status);
  }
}
