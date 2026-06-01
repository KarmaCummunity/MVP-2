import { describe, expect, it } from 'vitest';
import { mapRideParticipantRow } from '../mapRideParticipantRow';

describe('mapRideParticipantRow', () => {
  it('maps snake_case row to RideParticipant', () => {
    const out = mapRideParticipantRow({
      participant_id: 'p1',
      ride_id: 'r1',
      user_id: 'u1',
      status: 'approved',
      note: 'hello',
      requested_at: '2026-06-01T00:00:00Z',
      decided_at: '2026-06-01T01:00:00Z',
      decided_by: 'u_owner',
    });

    expect(out).toEqual({
      participantId: 'p1',
      rideId: 'r1',
      userId: 'u1',
      status: 'approved',
      note: 'hello',
      requestedAt: '2026-06-01T00:00:00Z',
      decidedAt: '2026-06-01T01:00:00Z',
      decidedBy: 'u_owner',
      joinedActiveAt: null,
    });
  });

  it('maps joined_active_at when present (FR-RIDE-032 snapshot)', () => {
    const out = mapRideParticipantRow({
      participant_id: 'p2',
      ride_id: 'r1',
      user_id: 'u1',
      status: 'approved',
      note: null,
      requested_at: '2026-06-01T00:00:00Z',
      decided_at: '2026-06-01T01:00:00Z',
      decided_by: 'u_owner',
      joined_active_at: '2026-06-01T08:00:00Z',
    });
    expect(out.joinedActiveAt).toBe('2026-06-01T08:00:00Z');
  });
});
