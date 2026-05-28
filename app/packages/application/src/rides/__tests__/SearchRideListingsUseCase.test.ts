import { describe, expect, it, vi } from 'vitest';
import type { RideListingRow } from '../../ports/IRideListingRepository';
import type { IRideMatchScorer } from '../ports/IRideMatchScorer';
import { SearchRideListingsUseCase } from '../SearchRideListingsUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

function makeRow(rideId: string, departsAt: string, status: RideListingRow['status'] = 'open'): RideListingRow {
  return {
    rideId,
    ownerId: 'u_owner',
    mode: 'offer',
    originCityId: '5000',
    destCityId: '4000',
    originCityName: 'Tel Aviv',
    destCityName: 'Haifa',
    originStreet: 'Allenby',
    originStreetNumber: '1',
    destStreet: 'Herzl',
    destStreetNumber: null,
    departsAt,
    seatsAvailable: 2,
    description: null,
    title: 'TLV → Haifa',
    status,
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
    startedAt: null,
    arrivedAt: null,
    arriveReason: null,
  };
}

describe('SearchRideListingsUseCase', () => {
  it('returns rows sorted chronologically by default', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      makeRow('r3', '2026-06-03T08:00:00Z'),
      makeRow('r1', '2026-06-01T08:00:00Z'),
      makeRow('r2', '2026-06-02T08:00:00Z'),
    ];

    const uc = new SearchRideListingsUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_viewer' });

    expect(out.map((r) => r.rideId)).toEqual(['r1', 'r2', 'r3']);
  });

  it('filters out non-open rows via the fake repo', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      makeRow('r1', '2026-06-01T08:00:00Z', 'open'),
      makeRow('r2', '2026-06-02T08:00:00Z', 'closed'),
      makeRow('r3', '2026-06-03T08:00:00Z', 'cancelled'),
    ];

    const uc = new SearchRideListingsUseCase(repo);
    const out = await uc.execute({ viewerId: 'u_viewer' });

    expect(out.map((r) => r.rideId)).toEqual(['r1']);
  });

  it('delegates ordering to an injected scorer', async () => {
    const repo = new FakeRideListingRepository();
    repo.rows = [
      makeRow('r1', '2026-06-01T08:00:00Z'),
      makeRow('r2', '2026-06-02T08:00:00Z'),
    ];

    const reverseScorer: IRideMatchScorer = {
      sort: <T extends { departsAt: string }>(rows: T[]): T[] =>
        [...rows].sort((a, b) => b.departsAt.localeCompare(a.departsAt)),
    };
    const sortSpy = vi.spyOn(reverseScorer, 'sort');

    const uc = new SearchRideListingsUseCase(repo, reverseScorer);
    const out = await uc.execute({ viewerId: 'u_viewer' });

    expect(sortSpy).toHaveBeenCalledTimes(1);
    expect(out.map((r) => r.rideId)).toEqual(['r2', 'r1']);
  });

  it('forwards the full input to the repository', async () => {
    const repo = new FakeRideListingRepository();
    const searchSpy = vi.spyOn(repo, 'search');

    const uc = new SearchRideListingsUseCase(repo);
    const input = {
      viewerId: 'u_viewer',
      query: 'haifa',
      originCityId: '5000',
      destCityId: '4000',
      mode: 'offer' as const,
      departFrom: '2026-06-01T00:00:00Z',
      departTo: '2026-06-30T00:00:00Z',
      limit: 25,
    };
    await uc.execute(input);

    expect(searchSpy).toHaveBeenCalledWith(input);
  });
});
