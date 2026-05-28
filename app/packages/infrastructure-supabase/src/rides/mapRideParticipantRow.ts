// FR-RIDE-011 — DB snake_case row → domain camelCase.
import type { RideParticipant, RideParticipantStatus } from '@kc/domain';

type Row = {
  participant_id: string;
  ride_id: string;
  user_id: string;
  status: string;
  note: string | null;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
};

export function mapRideParticipantRow(row: Row): RideParticipant {
  return {
    participantId: row.participant_id,
    rideId: row.ride_id,
    userId: row.user_id,
    status: row.status as RideParticipantStatus,
    note: row.note,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
  };
}
