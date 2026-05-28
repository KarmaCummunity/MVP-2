import { describe, expect, it, vi } from 'vitest';
import { UpdateRideVisibilityUseCase } from '../UpdateRideVisibilityUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

async function seedOpenRide(repo: FakeRideListingRepository) {
  return repo.create({
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
  });
}

describe('UpdateRideVisibilityUseCase', () => {
  it('changes visibility on an open ride', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seedOpenRide(repo);
    const uc = new UpdateRideVisibilityUseCase(repo);

    const out = await uc.execute({ rideId: row.rideId, visibility: 'FollowersOnly' });

    expect(out.visibility).toBe('FollowersOnly');
    expect(repo.rows[0]?.visibility).toBe('FollowersOnly');
  });

  it('forwards the call to the repo', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seedOpenRide(repo);
    const spy = vi.spyOn(repo, 'updateVisibility');
    const uc = new UpdateRideVisibilityUseCase(repo);

    await uc.execute({ rideId: row.rideId, visibility: 'OnlyMe' });

    expect(spy).toHaveBeenCalledWith({ rideId: row.rideId, visibility: 'OnlyMe' });
  });

  it('throws when the ride is not open', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seedOpenRide(repo);
    await repo.close(row.rideId, row.ownerId, 'closed');

    const uc = new UpdateRideVisibilityUseCase(repo);
    await expect(
      uc.execute({ rideId: row.rideId, visibility: 'FollowersOnly' }),
    ).rejects.toThrow('ride_not_open');
  });

  it('throws when the ride does not exist', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new UpdateRideVisibilityUseCase(repo);
    await expect(
      uc.execute({ rideId: 'missing', visibility: 'Public' }),
    ).rejects.toThrow('ride_not_found');
  });
});
