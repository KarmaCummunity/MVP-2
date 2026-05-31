// FR-RIDE-030 — read stops for a ride.
import type { RideStop } from '@kc/domain';
import type { IRideStopsRepository } from '../ports/IRideStopsRepository';

export class ListRideStopsUseCase {
  constructor(private readonly stops: IRideStopsRepository) {}

  async execute(rideId: string): Promise<readonly RideStop[]> {
    return this.stops.listForRide(rideId);
  }
}
