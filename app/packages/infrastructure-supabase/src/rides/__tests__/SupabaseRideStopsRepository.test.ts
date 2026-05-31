import { describe, expect, it, vi } from 'vitest';
import { RideError } from '@kc/domain';
import { SupabaseRideStopsRepository } from '../SupabaseRideStopsRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideStopsRepository>[0];

const STOPS_SELECT = '*, city:cities!ride_stops_city_id_fkey(name_he)';

const STOP_ROW = {
  stop_id: 's1',
  ride_id: 'r1',
  sort_order: 0,
  city_id: '5000',
  street: 'Allenby',
  notes: null,
  city: { name_he: 'תל אביב' },
} as const;

describe('SupabaseRideStopsRepository.listForRide', () => {
  it('selects with the city join, filters by ride_id, orders ascending, maps rows', async () => {
    const order = vi.fn().mockResolvedValue({ data: [STOP_ROW], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    const rows = await repo.listForRide('r1');

    expect(from).toHaveBeenCalledWith('ride_stops');
    expect(select).toHaveBeenCalledWith(STOPS_SELECT);
    expect(eq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(order).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(rows[0]).toEqual({
      stopId: 's1',
      rideId: 'r1',
      sortOrder: 0,
      cityId: '5000',
      cityName: 'תל אביב',
      street: 'Allenby',
      notes: null,
    });
  });

  it('falls back to empty cityName when the join is null', async () => {
    const order = vi
      .fn()
      .mockResolvedValue({ data: [{ ...STOP_ROW, city: null }], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    const rows = await repo.listForRide('r1');
    expect(rows[0]?.cityName).toBe('');
  });

  it('returns an empty array when data is null', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    expect(await repo.listForRide('r1')).toEqual([]);
  });

  it('throws on Supabase error', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    await expect(repo.listForRide('r1')).rejects.toThrow('denied');
  });
});

describe('SupabaseRideStopsRepository.setStops', () => {
  it('deletes existing rows then inserts the new list and maps the result', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const insSelect = vi.fn().mockResolvedValue({ data: [STOP_ROW], error: null });
    const insert = vi.fn().mockReturnValue({ select: insSelect });
    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: del }) // delete pass
      .mockReturnValueOnce({ insert }); // insert pass
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    const rows = await repo.setStops({
      rideId: 'r1',
      stops: [{ sortOrder: 0, cityId: '5000', street: 'Allenby', notes: null }],
    });

    expect(from).toHaveBeenNthCalledWith(1, 'ride_stops');
    expect(del).toHaveBeenCalled();
    expect(delEq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(insert).toHaveBeenCalledWith([
      { ride_id: 'r1', sort_order: 0, city_id: '5000', street: 'Allenby', notes: null },
    ]);
    expect(insSelect).toHaveBeenCalledWith(STOPS_SELECT);
    expect(rows[0]?.stopId).toBe('s1');
    expect(rows[0]?.cityName).toBe('תל אביב');
  });

  it('coalesces optional street/notes to null in the inserted rows', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const insSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    const insert = vi.fn().mockReturnValue({ select: insSelect });
    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: del })
      .mockReturnValueOnce({ insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    await repo.setStops({ rideId: 'r1', stops: [{ sortOrder: 1, cityId: '4000' }] });

    expect(insert).toHaveBeenCalledWith([
      { ride_id: 'r1', sort_order: 1, city_id: '4000', street: null, notes: null },
    ]);
  });

  it('short-circuits to an empty result (no insert) when stops is empty', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const insert = vi.fn();
    const from = vi.fn().mockReturnValue({ delete: del, insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    const rows = await repo.setStops({ rideId: 'r1', stops: [] });

    expect(rows).toEqual([]);
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws when the delete pass returns an error', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: { message: 'del_denied' } });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const from = vi.fn().mockReturnValue({ delete: del });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    await expect(
      repo.setStops({ rideId: 'r1', stops: [{ sortOrder: 0, cityId: '5000' }] }),
    ).rejects.toThrow('del_denied');
  });

  it('maps a stop_matches_endpoint insert error to a typed RideError', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const insSelect = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'check stop_matches_endpoint failed' } });
    const insert = vi.fn().mockReturnValue({ select: insSelect });
    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: del })
      .mockReturnValueOnce({ insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    const promise = repo.setStops({ rideId: 'r1', stops: [{ sortOrder: 0, cityId: '5000' }] });
    await expect(promise).rejects.toBeInstanceOf(RideError);
    await expect(promise).rejects.toMatchObject({ code: 'stop_matches_endpoint' });
  });

  it('falls back to a generic Error on other insert errors', async () => {
    const delEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: delEq });
    const insSelect = vi.fn().mockResolvedValue({ data: null, error: { message: 'rls_denied' } });
    const insert = vi.fn().mockReturnValue({ select: insSelect });
    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: del })
      .mockReturnValueOnce({ insert });
    const client = { from } as unknown as AnyClient;

    const repo = new SupabaseRideStopsRepository(client);
    await expect(
      repo.setStops({ rideId: 'r1', stops: [{ sortOrder: 0, cityId: '5000' }] }),
    ).rejects.toThrow('rls_denied');
  });
});
