import { describe, expect, it, vi } from 'vitest';
import { SupabaseRideListingRepository } from '../SupabaseRideListingRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideListingRepository>[0];

const RIDE_ROW = {
  ride_id: 'r1',
  owner_id: 'u_owner',
  mode: 'offer',
  origin_city_id: '5000',
  dest_city_id: '4000',
  origin_street: 'Allenby',
  origin_street_number: '1',
  dest_street: 'Herzl',
  dest_street_number: null,
  departs_at: '2026-06-01T08:00:00Z',
  seats_available: 3,
  description: null,
  title: 'TLV → Haifa',
  status: 'open',
  visibility: 'Public',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
} as const;

const RIDE_ROW_JOINED = {
  ...RIDE_ROW,
  origin_city: { name_he: 'תל אביב' },
  dest_city: { name_he: 'חיפה' },
};

describe('SupabaseRideListingRepository.create', () => {
  it('inserts then returns the joined row mapped to the domain shape', async () => {
    const single = vi.fn().mockResolvedValue({ data: RIDE_ROW_JOINED, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const row = await repo.create({
      ownerId: 'u_owner',
      mode: 'offer',
      originCityId: '5000',
      destCityId: '4000',
      originStreet: 'Allenby',
      originStreetNumber: '1',
      destStreet: 'Herzl',
      destStreetNumber: null,
      departsAt: '2026-06-01T08:00:00Z',
      seatsAvailable: 3,
      description: null,
      title: 'TLV → Haifa',
      visibility: 'Public',
    });

    expect(from).toHaveBeenCalledWith('ride_listings');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: 'u_owner',
        mode: 'offer',
        origin_city_id: '5000',
        dest_city_id: '4000',
        visibility: 'Public',
      }),
    );
    expect(row.rideId).toBe('r1');
    expect(row.originCityName).toBe('תל אביב');
    expect(row.destCityName).toBe('חיפה');
  });

  it('throws when the insert returns an error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'rls_denied' } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);

    await expect(
      repo.create({
        ownerId: 'u_owner',
        mode: 'offer',
        originCityId: '5000',
        destCityId: '4000',
        originStreet: 'a',
        originStreetNumber: null,
        destStreet: 'b',
        destStreetNumber: null,
        departsAt: '2026-06-01T08:00:00Z',
        seatsAvailable: 3,
        description: null,
        title: 't',
        visibility: 'Public',
      }),
    ).rejects.toThrow('rls_denied');
  });
});

describe('SupabaseRideListingRepository.getById', () => {
  it('returns the mapped row when present', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: RIDE_ROW_JOINED, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const row = await repo.getById('r1', 'u_viewer');

    expect(from).toHaveBeenCalledWith('ride_listings');
    expect(eq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(row?.rideId).toBe('r1');
  });

  it('returns null when no row matches', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const row = await repo.getById('missing', 'u_viewer');

    expect(row).toBeNull();
  });
});

describe('SupabaseRideListingRepository.search', () => {
  it('invokes the RPC with snake_case params and joins city names from a batch lookup', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [RIDE_ROW], error: null });
    const cityIn = vi.fn().mockResolvedValue({
      data: [
        { city_id: '5000', name_he: 'תל אביב' },
        { city_id: '4000', name_he: 'חיפה' },
      ],
      error: null,
    });
    const citySelect = vi.fn().mockReturnValue({ in: cityIn });
    const from = vi.fn().mockReturnValue({ select: citySelect });
    const client = { rpc, from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const rows = await repo.search({
      viewerId: 'u_viewer',
      query: 'haifa',
      originCityId: '5000',
      destCityId: '4000',
      mode: 'offer',
      departFrom: '2026-06-01T00:00:00Z',
      departTo: '2026-06-30T00:00:00Z',
      limit: 25,
    });

    expect(rpc).toHaveBeenCalledWith(
      'ride_listings_search',
      expect.objectContaining({
        p_query: 'haifa',
        p_origin_city_id: '5000',
        p_dest_city_id: '4000',
        p_mode: 'offer',
        p_depart_from: '2026-06-01T00:00:00Z',
        p_depart_to: '2026-06-30T00:00:00Z',
        p_limit: 25,
      }),
    );
    expect(from).toHaveBeenCalledWith('cities');
    expect(cityIn).toHaveBeenCalledWith('city_id', ['5000', '4000']);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.originCityName).toBe('תל אביב');
    expect(rows[0]?.destCityName).toBe('חיפה');
  });

  it('returns an empty array without a city lookup when the RPC returns no rows', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const from = vi.fn();
    const client = { rpc, from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    const rows = await repo.search({ viewerId: 'u_viewer' });

    expect(rows).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it('defaults the page size to 30 when limit is omitted', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    await repo.search({ viewerId: 'u_viewer' });

    expect(rpc).toHaveBeenCalledWith('ride_listings_search', expect.objectContaining({ p_limit: 30 }));
  });

  it('throws when the RPC returns an error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    await expect(repo.search({ viewerId: 'u_viewer' })).rejects.toThrow('boom');
  });
});

describe('SupabaseRideListingRepository.close', () => {
  it('scopes the update to the ride and owner', async () => {
    const eqOwner = vi.fn().mockResolvedValue({ error: null });
    const eqRide = vi.fn().mockReturnValue({ eq: eqOwner });
    const update = vi.fn().mockReturnValue({ eq: eqRide });
    const from = vi.fn().mockReturnValue({ update });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    await repo.close('r1', 'u_owner', 'closed');

    expect(from).toHaveBeenCalledWith('ride_listings');
    expect(update).toHaveBeenCalledWith({ status: 'closed' });
    expect(eqRide).toHaveBeenCalledWith('ride_id', 'r1');
    expect(eqOwner).toHaveBeenCalledWith('owner_id', 'u_owner');
  });

  it('throws when the update returns an error', async () => {
    const eqOwner = vi.fn().mockResolvedValue({ error: { message: 'denied' } });
    const eqRide = vi.fn().mockReturnValue({ eq: eqOwner });
    const update = vi.fn().mockReturnValue({ eq: eqRide });
    const from = vi.fn().mockReturnValue({ update });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideListingRepository(client);
    await expect(repo.close('r1', 'u_owner', 'cancelled')).rejects.toThrow('denied');
  });
});
