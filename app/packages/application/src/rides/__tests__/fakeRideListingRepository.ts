import type {
  CreateRideListingRepoInput,
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
}
