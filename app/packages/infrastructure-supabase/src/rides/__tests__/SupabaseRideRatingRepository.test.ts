import { describe, expect, it, vi } from 'vitest';
import { RideError } from '@kc/domain';
import { SupabaseRideRatingRepository } from '../SupabaseRideRatingRepository';

type AnyClient = ConstructorParameters<typeof SupabaseRideRatingRepository>[0];

const ROW = {
  rating_id: 'rt1',
  ride_id: 'r1',
  rater_id: 'u_rater',
  ratee_id: 'u_ratee',
  stars: 4,
  comment: 'great driver',
  is_penalty: false,
  created_at: '2026-06-01T09:00:00Z',
} as const;

const SUMMARY_ROW = {
  user_id: 'u_ratee',
  ratings_count: 3,
  avg_stars: 4.5,
  last_rated_at: '2026-06-01T09:00:00Z',
} as const;

describe('SupabaseRideRatingRepository.submit', () => {
  it('calls rpc_ride_rate with snake_case params and maps the row', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    const out = await repo.submit({
      rideId: 'r1',
      rateeId: 'u_ratee',
      stars: 4,
      comment: 'great driver',
      isPenalty: true,
    });

    expect(rpc).toHaveBeenCalledWith('rpc_ride_rate', {
      p_ride_id: 'r1',
      p_ratee_id: 'u_ratee',
      p_stars: 4,
      p_comment: 'great driver',
      p_is_penalty: true,
    });
    expect(out).toEqual({
      ratingId: 'rt1',
      rideId: 'r1',
      raterId: 'u_rater',
      rateeId: 'u_ratee',
      stars: 4,
      comment: 'great driver',
      isPenalty: false,
      createdAt: '2026-06-01T09:00:00Z',
    });
  });

  it('defaults isPenalty to false when omitted', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    await repo.submit({ rideId: 'r1', rateeId: 'u_ratee', stars: 5, comment: null });

    expect(rpc).toHaveBeenCalledWith(
      'rpc_ride_rate',
      expect.objectContaining({ p_is_penalty: false }),
    );
  });

  it.each([
    'auth_required',
    'ride_not_found',
    'rating_window_closed',
    'rating_duplicate',
    'rating_not_participant',
  ])('maps known PG error %s to a typed RideError', async (code) => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: code } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    const promise = repo.submit({ rideId: 'r1', rateeId: 'u_ratee', stars: 3, comment: null });
    await expect(promise).rejects.toBeInstanceOf(RideError);
    await expect(promise).rejects.toMatchObject({ code });
  });

  it('falls back to a generic Error on unknown PG error messages', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'random_db_error' } });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    await expect(
      repo.submit({ rideId: 'r1', rateeId: 'u_ratee', stars: 3, comment: null }),
    ).rejects.toThrow('random_db_error');
  });

  it('throws when the RPC returns no data', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc, from: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    await expect(
      repo.submit({ rideId: 'r1', rateeId: 'u_ratee', stars: 3, comment: null }),
    ).rejects.toThrow('submit_rating: empty response');
  });
});

describe('SupabaseRideRatingRepository.listForRide', () => {
  it('queries ride_ratings by ride_id ordered by created_at descending', async () => {
    const order = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    const rows = await repo.listForRide('r1');

    expect(from).toHaveBeenCalledWith('ride_ratings');
    expect(eq).toHaveBeenCalledWith('ride_id', 'r1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(rows[0]?.ratingId).toBe('rt1');
  });

  it('throws on Supabase error', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    await expect(repo.listForRide('r1')).rejects.toThrow('denied');
  });
});

describe('SupabaseRideRatingRepository.summaryFor', () => {
  it('queries the summary view by user_id and maps the row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: SUMMARY_ROW, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    const out = await repo.summaryFor('u_ratee');

    expect(from).toHaveBeenCalledWith('user_ride_rating_summary');
    expect(eq).toHaveBeenCalledWith('user_id', 'u_ratee');
    expect(out).toEqual({
      userId: 'u_ratee',
      ratingsCount: 3,
      avgStars: 4.5,
      lastRatedAt: '2026-06-01T09:00:00Z',
    });
  });

  it('coalesces null aggregate fields to zero', async () => {
    const row = { user_id: 'u_ratee', ratings_count: null, avg_stars: null, last_rated_at: null };
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    const out = await repo.summaryFor('u_ratee');

    expect(out).toEqual({
      userId: 'u_ratee',
      ratingsCount: 0,
      avgStars: 0,
      lastRatedAt: null,
    });
  });

  it('returns null when no row matches', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    expect(await repo.summaryFor('nobody')).toBeNull();
  });

  it('returns null when the row has no user_id', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { user_id: null }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    expect(await repo.summaryFor('u_ratee')).toBeNull();
  });

  it('throws on Supabase error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from, rpc: vi.fn() } as unknown as AnyClient;

    const repo = new SupabaseRideRatingRepository(client);
    await expect(repo.summaryFor('u_ratee')).rejects.toThrow('denied');
  });
});
