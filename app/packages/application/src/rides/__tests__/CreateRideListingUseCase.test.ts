import { describe, expect, it } from 'vitest';
import { RideError } from '@kc/domain';
import type { ICityRepository } from '../../ports/ICityRepository';
import { CreateRideListingUseCase } from '../CreateRideListingUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

const fakeCities: ICityRepository = {
  async listAll() {
    return [
      { cityId: '5000', nameHe: 'תל אביב', nameEn: 'Tel Aviv' },
      { cityId: '4000', nameHe: 'חיפה', nameEn: 'Haifa' },
    ];
  },
};

describe('CreateRideListingUseCase', () => {
  it('creates a listing with generated title', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new CreateRideListingUseCase(repo, fakeCities);
    const departsAt = new Date(Date.now() + 3600_000).toISOString();

    const row = await uc.execute({
      ownerId: 'u_1',
      mode: 'offer',
      originCityId: '5000',
      destCityId: '4000',
      originStreet: 'דיזנגוף',
      originStreetNumber: null,
      destStreet: 'הנביאים',
      destStreetNumber: null,
      departsAt,
      seatsAvailable: 3,
      description: null,
    });

    expect(row.rideId).toBe('ride-1');
    expect(repo.lastCreateArgs?.visibility).toBe('Public');
    expect(repo.lastCreateArgs?.title).toContain('תל אביב');
    expect(repo.lastCreateArgs?.title).toContain('חיפה');
  });

  it('propagates RideError from validateRideDraft', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new CreateRideListingUseCase(repo, fakeCities);

    await expect(
      uc.execute({
        ownerId: 'u_1',
        mode: 'offer',
        originCityId: '5000',
        destCityId: '5000',
        originStreet: 'א',
        originStreetNumber: null,
        destStreet: 'א',
        destStreetNumber: null,
        departsAt: new Date().toISOString(),
        seatsAvailable: 3,
        description: null,
      }),
    ).rejects.toBeInstanceOf(RideError);
  });
});
