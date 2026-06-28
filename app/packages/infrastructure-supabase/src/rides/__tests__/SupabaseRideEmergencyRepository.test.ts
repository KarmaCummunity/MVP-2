import { describe, expect, it, vi } from 'vitest';
import { RideError } from '@kc/domain';
import { SupabaseRideEmergencyRepository } from '../SupabaseRideEmergencyRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideEmergencyRepository>[0];

const ROW = {
  event_id: 'e1',
  ride_id: 'r1',
  triggered_by: 'u_rider',
  triggered_at: '2026-06-01T08:00:00Z',
  lat: 32.08,
  lng: 34.78,
  note: 'flat tire',
  resolved_at: null,
  resolved_by: null,
} as const;

describe('SupabaseRideEmergencyRepository.trigger', () => {
  it('calls rpc_ride_emergency_trigger with snake_case params and maps the row', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    const out = await repo.trigger({ rideId: 'r1', lat: 32.08, lng: 34.78, note: 'flat tire' });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_emergency_trigger', {
      p_ride_id: 'r1',
      p_lat: 32.08,
      p_lng: 34.78,
      p_note: 'flat tire',
    });
    expect(out).toEqual({
      eventId: 'e1',
      rideId: 'r1',
      triggeredBy: 'u_rider',
      triggeredAt: '2026-06-01T08:00:00Z',
      lat: 32.08,
      lng: 34.78,
      note: 'flat tire',
      resolvedAt: null,
      resolvedBy: null,
    });
  });

  it.each([
    'auth_required',
    'ride_not_found',
    'ride_not_in_transit',
    'not_ride_participant',
    'emergency_throttled',
  ])('maps known PG error %s to a typed RideError', async (code) => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: code } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    const promise = repo.trigger({ rideId: 'r1', lat: 0, lng: 0, note: null });
    await expect(promise).rejects.toBeInstanceOf(RideError);
    await expect(promise).rejects.toMatchObject({ code });
  });

  it('falls back to a generic Error on unknown PG error messages', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'random_db_error' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    await expect(
      repo.trigger({ rideId: 'r1', lat: 0, lng: 0, note: null }),
    ).rejects.toThrow('random_db_error');
  });

  it('throws when the RPC returns no data', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    await expect(
      repo.trigger({ rideId: 'r1', lat: 0, lng: 0, note: null }),
    ).rejects.toThrow('emergency_trigger: empty response');
  });
});

describe('SupabaseRideEmergencyRepository.listForRide', () => {
  it('queries by ride_id ordered by triggered_at descending and maps rows', async () => {
    const order = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    const rows = await repo.listForRide('r1');

    expect(from).toHaveBeenCalledWith('ride_emergency_events');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(order).toHaveBeenCalledWith('triggered_at', { ascending: false });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventId).toBe('e1');
  });

  it('returns an empty array when data is null', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    expect(await repo.listForRide('r1')).toEqual([]);
  });

  it('throws on Supabase error', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideEmergencyRepository(client);
    await expect(repo.listForRide('r1')).rejects.toThrow('denied');
  });
});
