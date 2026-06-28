import { describe, expect, it, vi } from 'vitest';
import { RideParticipantError } from '@kc/domain';
import { SupabaseRideParticipantRepository } from '../SupabaseRideParticipantRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideParticipantRepository>[0];

const ROW = {
  participant_id: 'p1',
  ride_id: 'r1',
  user_id: 'u_rider',
  status: 'requested',
  note: null,
  requested_at: '2026-06-01T00:00:00Z',
  decided_at: null,
  decided_by: null,
} as const;

describe('SupabaseRideParticipantRepository.request', () => {
  it('calls rpc_ride_participants_request and maps the row', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    const row = await repo.request({ rideId: 'r1', note: 'hello' });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_participants_request', {
      p_ride_id: 'r1',
      p_note: 'hello',
    });
    expect(row.participantId).toBe('p1');
    expect(row.status).toBe('requested');
  });

  it('passes null note as undefined so PG default kicks in', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await repo.request({ rideId: 'r1', note: null });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_participants_request', {
      p_ride_id: 'r1',
      p_note: undefined,
    });
  });

  it('throws a typed RideParticipantError on known PG error messages', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'already_requested' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await expect(repo.request({ rideId: 'r1', note: null })).rejects.toBeInstanceOf(
      RideParticipantError,
    );
  });

  it('falls back to a generic Error on unknown PG error messages', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'random_db_error' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await expect(repo.request({ rideId: 'r1', note: null })).rejects.toThrow('random_db_error');
  });
});

describe('SupabaseRideParticipantRepository.decide', () => {
  it('forwards participantId + status to the RPC', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { ...ROW, status: 'approved' }, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    const out = await repo.decide({ participantId: 'p1', status: 'approved' });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_participants_decide', {
      p_participant_id: 'p1',
      p_status: 'approved',
    });
    expect(out.status).toBe('approved');
  });

  it('throws ride_full as a typed error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'ride_full' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await expect(
      repo.decide({ participantId: 'p1', status: 'approved' }),
    ).rejects.toMatchObject({ code: 'ride_full' });
  });
});

describe('SupabaseRideParticipantRepository.cancel', () => {
  it('forwards participantId to the RPC', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { ...ROW, status: 'cancelled' }, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    const out = await repo.cancel({ participantId: 'p1' });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_participants_cancel', { p_participant_id: 'p1' });
    expect(out.status).toBe('cancelled');
  });
});

describe('SupabaseRideParticipantRepository.listForRide', () => {
  it('queries by ride_id ordered by requested_at ascending', async () => {
    const order = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    const rows = await repo.listForRide({ rideId: 'r1' });

    expect(from).toHaveBeenCalledWith('ride_participants');
    expect(eq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(order).toHaveBeenCalledWith('requested_at', { ascending: true });
    expect(rows[0]?.participantId).toBe('p1');
  });

  it('throws on Supabase error', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await expect(repo.listForRide({ rideId: 'r1' })).rejects.toThrow('denied');
  });
});

describe('SupabaseRideParticipantRepository.listForUser', () => {
  it('queries by user_id, descending by requested_at, with default limit 30', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await repo.listForUser({ userId: 'u_me' });

    expect(eq).toHaveBeenCalledWith('user_id', 'u_me');
    expect(order).toHaveBeenCalledWith('requested_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(30);
  });

  it('honors a custom limit', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideParticipantRepository(client);
    await repo.listForUser({ userId: 'u_me', limit: 5 });

    expect(limit).toHaveBeenCalledWith(5);
  });
});
