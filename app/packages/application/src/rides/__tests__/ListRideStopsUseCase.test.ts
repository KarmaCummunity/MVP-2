// FR-RIDE-030 — ListRideStopsUseCase reads stops for a ride.
import { describe, expect, it, vi } from 'vitest';
import type { RideStop } from '@kc/domain';
import { ListRideStopsUseCase } from '../ListRideStopsUseCase';
import type { IRideStopsRepository } from '../../ports/IRideStopsRepository';

function makeStop(sortOrder: number, cityId: string): RideStop {
  return {
    stopId: `stop-${sortOrder}`,
    rideId: 'ride-1',
    sortOrder,
    cityId,
    cityName: `City ${cityId}`,
    street: null,
    notes: null,
  };
}

describe('ListRideStopsUseCase', () => {
  it('returns the stops the repo finds for the ride', async () => {
    const stops = [makeStop(1, 'c-1'), makeStop(2, 'c-2')];
    const repo: IRideStopsRepository = {
      listForRide: vi.fn().mockResolvedValue(stops),
      setStops: vi.fn(),
    };

    const out = await new ListRideStopsUseCase(repo).execute('ride-1');

    expect(out).toEqual(stops);
    expect(repo.listForRide).toHaveBeenCalledWith('ride-1');
  });

  it('returns an empty list when the ride has no stops', async () => {
    const repo: IRideStopsRepository = {
      listForRide: vi.fn().mockResolvedValue([]),
      setStops: vi.fn(),
    };

    const out = await new ListRideStopsUseCase(repo).execute('ride-x');

    expect(out).toEqual([]);
  });
});
