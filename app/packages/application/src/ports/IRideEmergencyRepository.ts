// FR-RIDE-035 — port for ride emergency event persistence.
import type { RideEmergencyEvent } from '@kc/domain';

export interface TriggerRideEmergencyInput {
  rideId: string;
  /** GPS coords captured at trigger time, both NULL if user denied permission. */
  lat: number | null;
  lng: number | null;
  /** Optional rider note ≤ 500 chars. */
  note: string | null;
}

export interface IRideEmergencyRepository {
  /**
   * Trigger an emergency on an active ride. Caller must be the ride owner or a
   * snapshot participant; throttled to 1 trigger per (caller, ride) per 5 min
   * at the DB layer.
   */
  trigger(input: TriggerRideEmergencyInput): Promise<RideEmergencyEvent>;

  /** Read events for a ride; RLS scopes to triggering user / owner / super-admin. */
  listForRide(rideId: string): Promise<readonly RideEmergencyEvent[]>;
}
