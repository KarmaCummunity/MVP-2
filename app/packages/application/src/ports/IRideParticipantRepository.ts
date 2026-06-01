// FR-RIDE-011 / FR-RIDE-012 — port for ride participant persistence.
//
// Backed by the three SECURITY DEFINER RPCs in migration 0139_ride_participants.sql
// plus a SELECT path. The repository never issues direct INSERT/UPDATE/DELETE —
// every mutation goes through the corresponding RPC so seat counts and state
// transitions stay linearizable at the DB layer.

import type { RideParticipant } from '@kc/domain';

export interface IRideParticipantRepository {
  /** Caller (auth.uid()) requests to join the given ride. */
  request(input: { rideId: string; note: string | null }): Promise<RideParticipant>;

  /** Ride owner approves or rejects a pending request. */
  decide(input: { participantId: string; status: 'approved' | 'rejected' }): Promise<RideParticipant>;

  /** Participant cancels their own request/approved seat. Idempotent on already-cancelled. */
  cancel(input: { participantId: string }): Promise<RideParticipant>;

  /**
   * All participant rows for a ride. RLS scopes the result: ride owner sees
   * every row; non-owners see only their own row (if any).
   */
  listForRide(input: { rideId: string }): Promise<readonly RideParticipant[]>;

  /**
   * All participant rows the caller owns, recent first. Useful for the
   * future "my ride requests" surface.
   */
  listForUser(input: { userId: string; limit?: number }): Promise<readonly RideParticipant[]>;
}
