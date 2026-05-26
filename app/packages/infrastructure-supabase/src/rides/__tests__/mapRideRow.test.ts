import { describe, expect, it } from 'vitest';
import { mapRideRow } from '../mapRideRow';

describe('mapRideRow', () => {
  it('maps snake_case row to RideListingRow', () => {
    const out = mapRideRow(
      {
        ride_id: 'r1',
        owner_id: 'u1',
        mode: 'offer',
        origin_city_id: '5000',
        dest_city_id: '4000',
        departs_at: '2026-06-01T10:00:00Z',
        seats_available: 3,
        description: 'notes',
        title: 'Route',
        status: 'open',
        visibility: 'Public',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
      'תל אביב',
      'חיפה',
    );

    expect(out).toEqual({
      rideId: 'r1',
      ownerId: 'u1',
      mode: 'offer',
      originCityId: '5000',
      destCityId: '4000',
      originCityName: 'תל אביב',
      destCityName: 'חיפה',
      departsAt: '2026-06-01T10:00:00Z',
      seatsAvailable: 3,
      description: 'notes',
      title: 'Route',
      status: 'open',
      visibility: 'Public',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    });
  });
});
