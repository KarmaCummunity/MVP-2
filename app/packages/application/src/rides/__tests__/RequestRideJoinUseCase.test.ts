import { describe, expect, it } from 'vitest';
import { RideParticipantError } from '@kc/domain';
import { RequestRideJoinUseCase } from '../RequestRideJoinUseCase';
import { FakeRideParticipantRepository } from './fakeRideParticipantRepository';

function setup() {
  const repo = new FakeRideParticipantRepository();
  repo.seedRide({
    rideId: 'r1',
    ownerId: 'u_owner',
    status: 'open',
    visibility: 'Public',
    seatsAvailable: 3,
  });
  repo.setCaller('u_rider');
  return new RequestRideJoinUseCase(repo);
}

describe('RequestRideJoinUseCase', () => {
  it('creates a requested row when the inputs are valid', async () => {
    const uc = setup();
    const row = await uc.execute({ rideId: 'r1', note: 'happy to chip in for fuel' });

    expect(row.status).toBe('requested');
    expect(row.userId).toBe('u_rider');
    expect(row.note).toBe('happy to chip in for fuel');
  });

  it('allows a null note', async () => {
    const uc = setup();
    const row = await uc.execute({ rideId: 'r1', note: null });

    expect(row.note).toBeNull();
  });

  it('rejects notes longer than 500 chars before hitting the repo', async () => {
    const uc = setup();
    await expect(
      uc.execute({ rideId: 'r1', note: 'x'.repeat(501) }),
    ).rejects.toBeInstanceOf(RideParticipantError);
  });

  it('propagates ride_not_joinable from the repo when the ride is closed', async () => {
    const repo = new FakeRideParticipantRepository();
    repo.seedRide({
      rideId: 'r1',
      ownerId: 'u_owner',
      status: 'closed',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    repo.setCaller('u_rider');
    const uc = new RequestRideJoinUseCase(repo);

    await expect(uc.execute({ rideId: 'r1', note: null })).rejects.toMatchObject({
      code: 'ride_not_joinable',
    });
  });

  it('propagates cannot_join_own_ride when caller owns the ride', async () => {
    const repo = new FakeRideParticipantRepository();
    repo.seedRide({
      rideId: 'r1',
      ownerId: 'u_self',
      status: 'open',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    repo.setCaller('u_self');
    const uc = new RequestRideJoinUseCase(repo);

    await expect(uc.execute({ rideId: 'r1', note: null })).rejects.toMatchObject({
      code: 'cannot_join_own_ride',
    });
  });

  it('propagates already_requested on a second active request', async () => {
    const uc = setup();
    await uc.execute({ rideId: 'r1', note: null });
    await expect(uc.execute({ rideId: 'r1', note: null })).rejects.toMatchObject({
      code: 'already_requested',
    });
  });
});
