import { describe, expect, it, vi } from 'vitest';
import type { RideListingRow } from '../../ports/IRideListingRepository';
import { FindRideMatchesUseCase } from '../FindRideMatchesUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

function row(
  rideId: string,
  partial: Partial<RideListingRow> = {},
): RideListingRow {
  return {
    rideId,
    ownerId: 'u_o',
    mode: 'offer',
    originCityId: '5000',
    destCityId: '4000',
    originCityName: 'TLV',
    destCityName: 'Haifa',
    originStreet: 'a',
    originStreetNumber: null,
    destStreet: 'b',
    destStreetNumber: null,
    departsAt: '2026-06-01T08:00:00Z',
    seatsAvailable: 2,
    description: null,
    title: 'TLV → Haifa',
    status: 'open',
    visibility: 'Public',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    // FR-RIDE-026..029 — V3.0 defaults.
    cargoEnabled: false,
    cargoMaxVolumeL: null,
    cargoMaxWeightKg: null,
    cargoAllowedTypes: null,
    foodShippingEnabled: false,
    foodMaxKg: null,
    foodChilled: null,
    paymentModel: 'free',
    paymentAmountIls: null,
    reqGender: 'any',
    reqSmokingAllowed: false,
    reqPetsAllowed: false,
    reqVerifiedOnly: false,
    ...partial,
  };
}

describe('FindRideMatchesUseCase', () => {
  it('returns inverse-mode rides on the same route within the time window, nearest first', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      row('src', { mode: 'offer', departsAt: '2026-06-01T08:00:00Z' }),
      row('m1', { mode: 'request', departsAt: '2026-06-01T07:00:00Z' }),
      row('m2', { mode: 'request', departsAt: '2026-06-01T09:30:00Z' }),
      row('out_window', { mode: 'request', departsAt: '2026-06-02T08:00:00Z' }),
    ];

    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'src' });

    expect(matches.map((r) => r.rideId)).toEqual(['m1', 'm2']);
  });

  it('excludes the source ride itself and same-mode rides', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      row('src', { mode: 'offer' }),
      row('same_mode', { mode: 'offer' }),
      row('match', { mode: 'request' }),
    ];

    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'src' });

    expect(matches.map((r) => r.rideId)).toEqual(['match']);
  });

  it('excludes rides not on the same origin/dest pair', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      row('src', { mode: 'offer', originCityId: '5000', destCityId: '4000' }),
      row('wrong_origin', { mode: 'request', originCityId: '6000', destCityId: '4000' }),
      row('wrong_dest', { mode: 'request', originCityId: '5000', destCityId: '7000' }),
      row('match', { mode: 'request', originCityId: '5000', destCityId: '4000' }),
    ];

    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'src' });

    expect(matches.map((r) => r.rideId)).toEqual(['match']);
  });

  it('excludes non-open or non-public rides', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      row('src', { mode: 'offer' }),
      row('closed_match', { mode: 'request', status: 'closed' }),
      row('private_match', { mode: 'request', visibility: 'OnlyMe' }),
      row('match', { mode: 'request' }),
    ];

    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'src' });

    expect(matches.map((r) => r.rideId)).toEqual(['match']);
  });

  it('honors a custom window', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      row('src', { mode: 'offer', departsAt: '2026-06-01T08:00:00Z' }),
      row('in_2h', { mode: 'request', departsAt: '2026-06-01T10:00:00Z' }),
      row('in_18h', { mode: 'request', departsAt: '2026-06-02T02:00:00Z' }),
    ];

    const uc = new FindRideMatchesUseCase(repo);
    const matchesNarrow = await uc.execute({ rideId: 'src', windowHours: 3 });
    expect(matchesNarrow.map((r) => r.rideId)).toEqual(['in_2h']);

    const matchesWide = await uc.execute({ rideId: 'src', windowHours: 24 });
    expect(matchesWide.map((r) => r.rideId)).toEqual(['in_2h', 'in_18h']);
  });

  it('honors a custom limit', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [row('src', { mode: 'offer', departsAt: '2026-06-01T08:00:00Z' })];
    for (let i = 0; i < 5; i++) {
      repo.rows.push(
        row(`m_${i}`, {
          mode: 'request',
          departsAt: new Date(new Date('2026-06-01T08:00:00Z').getTime() + i * 60_000).toISOString(),
        }),
      );
    }
    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'src', limit: 2 });
    expect(matches).toHaveLength(2);
  });

  it('returns empty when source ride is unknown', async () => {
    const repo = new FakeRideListingRepository();
    const uc = new FindRideMatchesUseCase(repo);
    const matches = await uc.execute({ rideId: 'missing' });
    expect(matches).toEqual([]);
  });

  it('forwards input to the repository', async () => {
    const repo = new FakeRideListingRepository();
    const spy = vi.spyOn(repo, 'findMatches');
    const uc = new FindRideMatchesUseCase(repo);
    await uc.execute({ rideId: 'r1', windowHours: 6, limit: 5 });
    expect(spy).toHaveBeenCalledWith({ rideId: 'r1', windowHours: 6, limit: 5 });
  });
});
