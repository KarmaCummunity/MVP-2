// FR-RIDE-030 — owner sets/replaces intermediate stops on a ride.
// Domain validation: ≤ 3 stops, no duplicate city across stops, no city matching
// origin or destination (server trigger also enforces but we fail-fast here).
import { RideError } from '@kc/domain';
import type { RideStop } from '@kc/domain';
import type { IRideListingRepository } from '../ports/IRideListingRepository';
import type {
  IRideStopsRepository,
  SetRideStopsInput,
} from '../ports/IRideStopsRepository';

export interface SetRideStopsUseCaseInput extends SetRideStopsInput {
  /** The caller (must be the ride owner). */
  ownerId: string;
}

export class SetRideStopsUseCase {
  constructor(
    private readonly stops: IRideStopsRepository,
    private readonly rides: IRideListingRepository,
  ) {}

  async execute(input: SetRideStopsUseCaseInput): Promise<readonly RideStop[]> {
    if (input.stops.length > 3) {
      throw new RideError('too_many_stops', 'a ride may carry at most 3 intermediate stops');
    }

    const sortOrders = new Set<number>();
    const cities = new Set<string>();
    for (const s of input.stops) {
      if (s.sortOrder < 1 || s.sortOrder > 3) {
        throw new RideError('too_many_stops', 'stop sort_order must be 1..3');
      }
      if (sortOrders.has(s.sortOrder)) {
        throw new RideError('too_many_stops', 'duplicate stop sort_order');
      }
      sortOrders.add(s.sortOrder);
      if (cities.has(s.cityId)) {
        throw new RideError('stop_duplicate_city', 'duplicate stop city');
      }
      cities.add(s.cityId);
    }

    // Endpoint check (mirrors the server trigger so the UI gets a typed error).
    const ride = await this.rides.getById(input.rideId, input.ownerId);
    if (!ride) {
      throw new RideError('ride_not_found', 'ride not found');
    }
    if (ride.ownerId !== input.ownerId) {
      throw new RideError('not_ride_owner', 'not the ride owner');
    }
    for (const s of input.stops) {
      if (s.cityId === ride.originCityId || s.cityId === ride.destCityId) {
        throw new RideError(
          'stop_matches_endpoint',
          'a stop city cannot match the origin or destination',
        );
      }
    }

    return this.stops.setStops({ rideId: input.rideId, stops: input.stops });
  }
}
