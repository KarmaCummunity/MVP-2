// FR-RIDE-035 — ListRideEmergencyEventsUseCase reads events for a ride.
import { describe, expect, it, vi } from 'vitest';
import type { RideEmergencyEvent } from '@kc/domain';
import { ListRideEmergencyEventsUseCase } from '../ListRideEmergencyEventsUseCase';
import type { IRideEmergencyRepository } from '../../ports/IRideEmergencyRepository';

function makeEvent(id: string): RideEmergencyEvent {
  return {
    eventId: id,
    rideId: 'ride-1',
    triggeredBy: 'u_owner',
    triggeredAt: '2026-05-31T10:00:00Z',
    lat: 32.0,
    lng: 34.0,
    note: null,
    resolvedAt: null,
    resolvedBy: null,
  };
}

describe('ListRideEmergencyEventsUseCase', () => {
  it('returns the events the repo finds for the ride', async () => {
    const events = [makeEvent('e1'), makeEvent('e2')];
    const repo: IRideEmergencyRepository = {
      trigger: vi.fn(),
      listForRide: vi.fn().mockResolvedValue(events),
    };

    const out = await new ListRideEmergencyEventsUseCase(repo).execute('ride-1');

    expect(out).toEqual(events);
    expect(repo.listForRide).toHaveBeenCalledWith('ride-1');
  });

  it('returns an empty list when the ride has no events', async () => {
    const repo: IRideEmergencyRepository = {
      trigger: vi.fn(),
      listForRide: vi.fn().mockResolvedValue([]),
    };

    const out = await new ListRideEmergencyEventsUseCase(repo).execute('ride-x');

    expect(out).toEqual([]);
  });
});
