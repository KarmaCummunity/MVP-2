// FR-RIDE-031 — StartRideUseCase via the fake repo state machine.
import { describe, expect, it } from 'vitest';
import { StartRideUseCase } from '../StartRideUseCase';
import { ArriveRideUseCase } from '../ArriveRideUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

const ME = '11111111-1111-4111-8111-111111111111';

async function makeOpenRide(
  repo: FakeRideListingRepository,
  overrides: { departsAt?: string } = {},
) {
  return repo.create({
    ownerId: ME,
    mode: 'offer',
    originCityId: 'c-tlv',
    destCityId: 'c-jlm',
    originStreet: 'A',
    originStreetNumber: null,
    destStreet: 'B',
    destStreetNumber: null,
    departsAt: overrides.departsAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
    seatsAvailable: 3,
    description: null,
    title: 'TLV→JLM',
    visibility: 'Public',
  });
}

describe('StartRideUseCase + ArriveRideUseCase', () => {
  it('rejects starting too far before departure', async () => {
    const repo = new FakeRideListingRepository();
    const ride = await makeOpenRide(repo, {
      departsAt: new Date(Date.now() + 2 * 60 * 60_000).toISOString(), // 2h ahead
    });
    await expect(new StartRideUseCase(repo).execute(ride.rideId)).rejects.toThrow(
      /start_window_not_open/,
    );
  });

  it('starts within the 30-minute window and is idempotent', async () => {
    const repo = new FakeRideListingRepository();
    const ride = await makeOpenRide(repo);
    const started = await new StartRideUseCase(repo).execute(ride.rideId);
    expect(started.status).toBe('in_transit');
    expect(started.startedAt).not.toBeNull();
    // Idempotent — calling again returns the same in_transit row.
    const again = await new StartRideUseCase(repo).execute(ride.rideId);
    expect(again.status).toBe('in_transit');
    expect(again.startedAt).toBe(started.startedAt);
  });

  it('arrive transitions to completed_pending_rating', async () => {
    const repo = new FakeRideListingRepository();
    const ride = await makeOpenRide(repo);
    await new StartRideUseCase(repo).execute(ride.rideId);
    const arrived = await new ArriveRideUseCase(repo).execute({ rideId: ride.rideId });
    expect(arrived.status).toBe('completed_pending_rating');
    expect(arrived.arrivedAt).not.toBeNull();
    expect(arrived.arriveReason).toBe('arrived');
  });

  it('arrive rejects before starting', async () => {
    const repo = new FakeRideListingRepository();
    const ride = await makeOpenRide(repo);
    await expect(
      new ArriveRideUseCase(repo).execute({ rideId: ride.rideId }),
    ).rejects.toThrow(/ride_not_in_transit/);
  });

  it('arrive carries breakdown reason', async () => {
    const repo = new FakeRideListingRepository();
    const ride = await makeOpenRide(repo);
    await new StartRideUseCase(repo).execute(ride.rideId);
    const arrived = await new ArriveRideUseCase(repo).execute({
      rideId: ride.rideId,
      reason: 'breakdown',
    });
    expect(arrived.arriveReason).toBe('breakdown');
  });
});
