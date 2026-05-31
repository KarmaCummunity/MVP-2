// FR-RIDE-030 — SetRideStopsUseCase enforces stop count, ordering, uniqueness,
// ownership, and the endpoint-collision rule before delegating to the repo.
import { describe, expect, it, vi } from 'vitest';
import type { RideStop } from '@kc/domain';
import { SetRideStopsUseCase } from '../SetRideStopsUseCase';
import type {
  IRideStopsRepository,
  SetRideStopsInput,
} from '../../ports/IRideStopsRepository';
import type { IRideListingRepository, RideListingRow } from '../../ports/IRideListingRepository';

const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function makeRide(over: Partial<RideListingRow> = {}): RideListingRow {
  return {
    rideId: 'ride-1',
    ownerId: OWNER,
    mode: 'offer',
    originCityId: 'c-origin',
    destCityId: 'c-dest',
    originCityName: 'Origin',
    destCityName: 'Dest',
    originStreet: 'A',
    originStreetNumber: null,
    destStreet: 'B',
    destStreetNumber: null,
    departsAt: '2026-06-01T08:00:00Z',
    seatsAvailable: 3,
    description: null,
    title: 'TLV→JLM',
    status: 'open',
    visibility: 'Public',
    createdAt: '2026-05-31T00:00:00Z',
    updatedAt: '2026-05-31T00:00:00Z',
    startedAt: null,
    arrivedAt: null,
    arriveReason: null,
    linkedPostId: null,
    foodHandoverToOrg: false,
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
    ...over,
  };
}

function makeStopsRepo(): { stops: IRideStopsRepository; setStops: ReturnType<typeof vi.fn> } {
  const setStops = vi.fn(
    async (input: SetRideStopsInput): Promise<readonly RideStop[]> =>
      input.stops.map((s) => ({
        stopId: `stop-${s.sortOrder}`,
        rideId: input.rideId,
        sortOrder: s.sortOrder,
        cityId: s.cityId,
        cityName: `City ${s.cityId}`,
        street: s.street ?? null,
        notes: s.notes ?? null,
      })),
  );
  return { stops: { listForRide: vi.fn(), setStops }, setStops };
}

function makeRidesRepo(ride: RideListingRow | null): IRideListingRepository {
  return { getById: vi.fn().mockResolvedValue(ride) } as unknown as IRideListingRepository;
}

describe('SetRideStopsUseCase', () => {
  it('persists a valid set of stops', async () => {
    const { stops, setStops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    const out = await new SetRideStopsUseCase(stops, rides).execute({
      rideId: 'ride-1',
      ownerId: OWNER,
      stops: [
        { sortOrder: 1, cityId: 'c-1' },
        { sortOrder: 2, cityId: 'c-2' },
      ],
    });
    expect(out).toHaveLength(2);
    expect(setStops).toHaveBeenCalledWith({
      rideId: 'ride-1',
      stops: [
        { sortOrder: 1, cityId: 'c-1' },
        { sortOrder: 2, cityId: 'c-2' },
      ],
    });
  });

  it('accepts an empty stops list (clears stops)', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    const out = await new SetRideStopsUseCase(stops, rides).execute({
      rideId: 'ride-1',
      ownerId: OWNER,
      stops: [],
    });
    expect(out).toEqual([]);
  });

  it('rejects more than 3 stops', async () => {
    const { stops, setStops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [
          { sortOrder: 1, cityId: 'c-1' },
          { sortOrder: 2, cityId: 'c-2' },
          { sortOrder: 3, cityId: 'c-3' },
          { sortOrder: 4, cityId: 'c-4' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'too_many_stops' });
    expect(setStops).not.toHaveBeenCalled();
  });

  it('rejects a sort_order outside 1..3', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [{ sortOrder: 0, cityId: 'c-1' }],
      }),
    ).rejects.toMatchObject({ code: 'too_many_stops' });
  });

  it('rejects duplicate sort_order', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [
          { sortOrder: 1, cityId: 'c-1' },
          { sortOrder: 1, cityId: 'c-2' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'too_many_stops' });
  });

  it('rejects a duplicate stop city', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [
          { sortOrder: 1, cityId: 'c-dup' },
          { sortOrder: 2, cityId: 'c-dup' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'stop_duplicate_city' });
  });

  it('rejects when the ride is not found', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(null);
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'missing',
        ownerId: OWNER,
        stops: [{ sortOrder: 1, cityId: 'c-1' }],
      }),
    ).rejects.toMatchObject({ code: 'ride_not_found' });
  });

  it('rejects when the caller is not the ride owner', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide({ ownerId: OTHER }));
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [{ sortOrder: 1, cityId: 'c-1' }],
      }),
    ).rejects.toMatchObject({ code: 'not_ride_owner' });
  });

  it('rejects a stop whose city matches the origin', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [{ sortOrder: 1, cityId: 'c-origin' }],
      }),
    ).rejects.toMatchObject({ code: 'stop_matches_endpoint' });
  });

  it('rejects a stop whose city matches the destination', async () => {
    const { stops } = makeStopsRepo();
    const rides = makeRidesRepo(makeRide());
    await expect(
      new SetRideStopsUseCase(stops, rides).execute({
        rideId: 'ride-1',
        ownerId: OWNER,
        stops: [{ sortOrder: 1, cityId: 'c-dest' }],
      }),
    ).rejects.toMatchObject({ code: 'stop_matches_endpoint' });
  });
});
