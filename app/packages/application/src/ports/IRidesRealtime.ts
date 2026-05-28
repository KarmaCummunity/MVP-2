// IRidesRealtime — port for realtime updates on the rides surfaces.
// Mapped to: FR-RIDE-016.
//
// The application layer subscribes to:
//   * INSERTs of public, open ride_listings → "↑ N new rides" pill on the hub.
//   * UPDATEs of ride_participants for the calling user → live status changes
//     on the rider's "my requests" surface.
//   * INSERTs of ride_participants on rides the caller owns → live "new
//     join request" pip on the owner's ride detail surface.
//
// The full row is NOT delivered here — callbacks fire as signals only.
// Consumers refetch the relevant query so RLS/visibility re-checks run
// server-side. Mirrors IFeedRealtime + IChatRealtime.

export type Unsubscribe = () => void;

export interface RidesRealtimeCallbacks {
  /** Fires once per INSERT after the channel is SUBSCRIBED. */
  onChange: () => void;
  /** Optional error sink. The store decides whether to surface or swallow. */
  onError?: (error: Error) => void;
}

export interface IRidesRealtime {
  /** Subscribe to public ride INSERTs (new offers/requests on the hub). */
  subscribeToPublicRideInserts(cb: RidesRealtimeCallbacks): Unsubscribe;

  /**
   * Subscribe to ride_participants rows for a particular user. Fires on the
   * rider's own row changes (status transitions: requested → approved /
   * rejected, approved → cancelled).
   */
  subscribeToUserParticipantUpdates(userId: string, cb: RidesRealtimeCallbacks): Unsubscribe;

  /**
   * Subscribe to ride_participants INSERTs for a particular ride. Lets the
   * ride owner see new join requests live on the detail surface.
   */
  subscribeToRideParticipantInserts(rideId: string, cb: RidesRealtimeCallbacks): Unsubscribe;
}
