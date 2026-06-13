// FR-RIDE-030 — port for intermediate-stops persistence.
import type { RideStop } from '@kc/domain';

export interface SetRideStopsInput {
  rideId: string;
  stops: ReadonlyArray<{
    sortOrder: number;
    cityId: string;
    street?: string | null;
    notes?: string | null;
  }>;
}

export interface IRideStopsRepository {
  /** Read the stops attached to a ride, ordered by `sort_order`. */
  listForRide(rideId: string): Promise<readonly RideStop[]>;

  /**
   * Replace the entire stops list for a ride. Owner-only via RLS. The adapter
   * deletes existing rows then inserts the new list in a single transaction.
   */
  setStops(input: SetRideStopsInput): Promise<readonly RideStop[]>;
}
