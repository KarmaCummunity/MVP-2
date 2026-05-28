import type {
  CreateRideListingRepoInput,
  FindRideMatchesInput,
  IRideListingRepository,
  RideListingRow,
  SearchRideListingsInput,
} from '../../ports/IRideListingRepository';

export class FakeRideListingRepository implements IRideListingRepository {
  rows: RideListingRow[] = [];
  lastCreateArgs: CreateRideListingRepoInput | null = null;

  async create(input: CreateRideListingRepoInput): Promise<RideListingRow> {
    this.lastCreateArgs = input;
    const row: RideListingRow = {
      rideId: `ride-${this.rows.length + 1}`,
      ownerId: input.ownerId,
      mode: input.mode,
      originCityId: input.originCityId,
      destCityId: input.destCityId,
      originCityName: 'Origin',
      destCityName: 'Dest',
      originStreet: input.originStreet,
      originStreetNumber: input.originStreetNumber,
      destStreet: input.destStreet,
      destStreetNumber: input.destStreetNumber,
      departsAt: input.departsAt,
      seatsAvailable: input.seatsAvailable,
      description: input.description,
      title: input.title,
      status: 'open',
      visibility: input.visibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return row;
  }

  async getById(rideId: string, _viewerId: string): Promise<RideListingRow | null> {
    return this.rows.find((r) => r.rideId === rideId) ?? null;
  }

  async search(_input: SearchRideListingsInput): Promise<RideListingRow[]> {
    return this.rows.filter((r) => r.status === 'open');
  }

  async close(rideId: string, ownerId: string, status: 'closed' | 'cancelled'): Promise<void> {
    const idx = this.rows.findIndex((r) => r.rideId === rideId && r.ownerId === ownerId);
    const row = idx >= 0 ? this.rows[idx] : undefined;
    if (row) {
      this.rows[idx] = { ...row, status };
    }
  }

  async findMatches(input: FindRideMatchesInput): Promise<RideListingRow[]> {
    const source = this.rows.find((r) => r.rideId === input.rideId);
    if (!source) return [];
    const windowMs = (input.windowHours ?? 12) * 60 * 60 * 1000;
    const srcTs = new Date(source.departsAt).getTime();
    return this.rows
      .filter(
        (r) =>
          r.rideId !== source.rideId &&
          r.status === 'open' &&
          r.visibility === 'Public' &&
          r.mode !== source.mode &&
          r.originCityId === source.originCityId &&
          r.destCityId === source.destCityId &&
          Math.abs(new Date(r.departsAt).getTime() - srcTs) <= windowMs,
      )
      .sort(
        (a, b) =>
          Math.abs(new Date(a.departsAt).getTime() - srcTs) -
          Math.abs(new Date(b.departsAt).getTime() - srcTs),
      )
      .slice(0, input.limit ?? 20);
  }
}
