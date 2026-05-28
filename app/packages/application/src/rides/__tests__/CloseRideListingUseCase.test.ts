import { describe, expect, it, vi } from 'vitest';
import { CloseRideListingUseCase } from '../CloseRideListingUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

async function seed(repo: FakeRideListingRepository, ownerId = 'u_owner') {
  return repo.create({
    ownerId,
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
}

describe('CloseRideListingUseCase', () => {
  it('marks an owned ride as closed', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seed(repo);

    const uc = new CloseRideListingUseCase(repo);
    await uc.execute({ rideId: row.rideId, ownerId: row.ownerId, status: 'closed' });

    expect(repo.rows[0]?.status).toBe('closed');
  });

  it('marks an owned ride as cancelled', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seed(repo);

    const uc = new CloseRideListingUseCase(repo);
    await uc.execute({ rideId: row.rideId, ownerId: row.ownerId, status: 'cancelled' });

    expect(repo.rows[0]?.status).toBe('cancelled');
  });

  it('throws when the ride does not exist', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new CloseRideListingUseCase(repo);

    await expect(
      uc.execute({ rideId: 'missing', ownerId: 'u_owner', status: 'closed' }),
    ).rejects.toThrow('ride_not_found_or_forbidden');
  });

  it('throws and does not mutate when the caller is not the owner', async () => {
    const repo = new FakeRideListingRepository();
    const row = await seed(repo, 'u_owner');
    const closeSpy = vi.spyOn(repo, 'close');

    const uc = new CloseRideListingUseCase(repo);
    await expect(
      uc.execute({ rideId: row.rideId, ownerId: 'u_intruder', status: 'closed' }),
    ).rejects.toThrow('ride_not_found_or_forbidden');

    expect(closeSpy).not.toHaveBeenCalled();
    expect(repo.rows[0]?.status).toBe('open');
  });
});
