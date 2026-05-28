// FR-RIDE-011 — ride participant entity.
import type { RideParticipantStatus } from './RideParticipantStatus';

export interface RideParticipant {
  readonly participantId: string;
  readonly rideId: string;
  readonly userId: string;
  readonly status: RideParticipantStatus;
  readonly note: string | null;
  readonly requestedAt: string;
  readonly decidedAt: string | null;
  readonly decidedBy: string | null;
}
