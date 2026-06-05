// FR-RIDE-035 — emergency event domain entity.

export interface RideEmergencyEvent {
  readonly eventId: string;
  readonly rideId: string;
  readonly triggeredBy: string;
  readonly triggeredAt: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly note: string | null;
  readonly resolvedAt: string | null;
  readonly resolvedBy: string | null;
}
