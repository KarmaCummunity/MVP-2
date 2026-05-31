// FR-RIDE-024 — ListMyRidesUseCase covers status + window filtering.
import { describe, expect, it } from 'vitest';
import { ListMyRidesUseCase } from '../ListMyRidesUseCase';
import { FakeRideListingRepository } from './fakeRideListingRepository';

const ME = '11111111-1111-4111-8111-111111111111';
const THEM = '22222222-2222-4222-8222-222222222222';

function makeRow(
  repo: FakeRideListingRepository,
  overrides: { ownerId?: string; status?: 'open' | 'closed' | 'cancelled' | 'expired'; departsAt?: string } = {},
) {
  return repo.create({
    ownerId: overrides.ownerId ?? ME,
    mode: 'offer',
    originCityId: 'city-tlv',
    destCityId: 'city-jlm',
    originStreet: 'Allenby',
    originStreetNumber: '1',
    destStreet: 'Jaffa',
    destStreetNumber: null,
    departsAt: overrides.departsAt ?? new Date(Date.now() + 60 * 60_000).toISOString(),
    seatsAvailable: 3,
    description: null,
    title: 'TLV→JLM',
    visibility: 'Public',
  }).then((row) => {
    if (overrides.status && overrides.status !== 'open') {
      // FakeRepo.close only transitions to closed/cancelled — for expired we
      // mutate the row in place to keep the test compact.
      const idx = repo.rows.findIndex((r) => r.rideId === row.rideId);
      repo.rows[idx] = { ...row, status: overrides.status };
    }
    return row;
  });
}

describe('ListMyRidesUseCase', () => {
  it('returns only the caller\'s rides', async () => {
    const repo = new FakeRideListingRepository();
    await makeRow(repo, { ownerId: ME });
    await makeRow(repo, { ownerId: THEM });
    const useCase = new ListMyRidesUseCase(repo);
    const rows = await useCase.execute({ ownerId: ME });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.ownerId).toBe(ME);
  });

  it('orders by departs_at descending', async () => {
    const repo = new FakeRideListingRepository();
    const past = new Date(Date.now() + 3600_000).toISOString();
    const future = new Date(Date.now() + 7200_000).toISOString();
    await makeRow(repo, { departsAt: past });
    await makeRow(repo, { departsAt: future });
    const rows = await new ListMyRidesUseCase(repo).execute({ ownerId: ME });
    expect(rows[0]!.departsAt).toBe(future);
    expect(rows[1]!.departsAt).toBe(past);
  });

  it('honors the statuses filter', async () => {
    const repo = new FakeRideListingRepository();
    await makeRow(repo, { status: 'open' });
    await makeRow(repo, { status: 'cancelled' });
    const onlyOpen = await new ListMyRidesUseCase(repo).execute({
      ownerId: ME,
      statuses: ['open'],
    });
    expect(onlyOpen).toHaveLength(1);
    expect(onlyOpen[0]!.status).toBe('open');
  });

  it('clamps the past window to 30 days by default', async () => {
    const repo = new FakeRideListingRepository();
    const farPast = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString();
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60_000).toISOString();
    await makeRow(repo, { departsAt: farPast, status: 'closed' });
    await makeRow(repo, { departsAt: recent, status: 'closed' });
    const rows = await new ListMyRidesUseCase(repo).execute({ ownerId: ME });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.departsAt).toBe(recent);
  });

  it('disables the window when since=null', async () => {
    const repo = new FakeRideListingRepository();
    const farPast = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString();
    await makeRow(repo, { departsAt: farPast, status: 'closed' });
    const rows = await new ListMyRidesUseCase(repo).execute({ ownerId: ME, since: null });
    expect(rows).toHaveLength(1);
  });
});
