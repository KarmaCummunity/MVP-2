// FR-RIDE-035 — read emergency events for a ride.
import type { RideEmergencyEvent } from '@kc/domain';
import type { IRideEmergencyRepository } from '../ports/IRideEmergencyRepository';

export class ListRideEmergencyEventsUseCase {
  constructor(private readonly repo: IRideEmergencyRepository) {}

  async execute(rideId: string): Promise<readonly RideEmergencyEvent[]> {
    return this.repo.listForRide(rideId);
  }
}
