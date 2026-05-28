import { describe, expect, it, vi } from 'vitest';
import { GetRideListingUseCase } from '../GetRideListingUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

describe('GetRideListingUseCase', () => {
  it('returns the row when the repo finds it', async () => {
    const repo = new FakeRideListingRepository();
    await repo.create({
      ownerId: 'u_owner',
      mode: 'offer',
      originCityId: '5000',
      destCityId: '4000',
      originStreet: 'Allenby',
      originStreetNumber: null,
      destStreet: 'Herzl',
      destStreetNumber: null,
      departsAt: '2026-06-01T08:00:00Z',
      seatsAvailable: 3,
      description: null,
      title: 'TLV → Haifa',
      visibility: 'Public',
    });

    const uc = new GetRideListingUseCase(repo);
    const out = await uc.execute({ rideId: 'ride-1', viewerId: 'u_viewer' });

    expect(out?.rideId).toBe('ride-1');
  });

  it('returns null when the repo finds nothing', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new GetRideListingUseCase(repo);

    const out = await uc.execute({ rideId: 'missing', viewerId: 'u_viewer' });

    expect(out).toBeNull();
  });

  it('forwards rideId and viewerId to the repository', async () => {
    const repo = new FakeRideListingRepository();
    const getSpy = vi.spyOn(repo, 'getById');

    const uc = new GetRideListingUseCase(repo);
    await uc.execute({ rideId: 'r_42', viewerId: 'u_viewer_7' });

    expect(getSpy).toHaveBeenCalledWith('r_42', 'u_viewer_7');
  });
});
