import { describe, expect, it, vi } from 'vitest';
import { SupabaseRideListingRepository } from '../SupabaseRideListingRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideListingRepository>[0];

const ROW = {
  ride_id: 'r1',
  owner_id: 'u_o',
  mode: 'request',
  origin_city_id: '5000',
  dest_city_id: '4000',
  origin_street: 'a',
  origin_street_number: null,
  dest_street: 'b',
  dest_street_number: null,
  departs_at: '2026-06-01T08:00:00Z',
  seats_available: null,
  description: null,
  title: 'Haifa ← TLV',
  status: 'open',
  visibility: 'Public',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
} as const;

describe('SupabaseRideListingRepository.findMatches', () => {
  it('invokes the RPC with snake_case params and joins city names', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const cityIn = vi.fn().mockResolvedValue({
      data: [
        { city_id: '5000', name_he: 'TLV' },
        { city_id: '4000', name_he: 'Haifa' },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ in: cityIn });
    const from = vi.fn().mockReturnValue({ select });
    const client = { rpc, from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const rows = await repo.findMatches({ rideId: 'src', windowHours: 6, limit: 5 });

    expect(rpc).toHaveBeenCalledWith('ride_listings_find_matches', {
      p_ride_id: 'src',
      p_window_hours: 6,
      p_limit: 5,
    });
    expect(from).toHaveBeenCalledWith('cities');
    expect(cityIn).toHaveBeenCalledWith('city_id', ['5000', '4000']);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.originCityName).toBe('TLV');
  });

  it('returns empty without a city lookup when RPC returns no rows', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const from = vi.fn();
    const client = { rpc, from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const rows = await repo.findMatches({ rideId: 'src' });

    expect(rows).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it('throws when the RPC errors', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'not_ride_owner' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    await expect(repo.findMatches({ rideId: 'src' })).rejects.toThrow('not_ride_owner');
  });
});
