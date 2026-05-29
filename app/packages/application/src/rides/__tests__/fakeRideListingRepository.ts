import type {
  CreateRideListingRepoInput,
  FindRideMatchesInput,
  IRideListingRepository,
  ListMyRidesInput,
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
      // FR-RIDE-026..029 — V3.0 advanced columns.
      cargoEnabled: input.cargoEnabled ?? false,
      cargoMaxVolumeL: input.cargoEnabled ? input.cargoMaxVolumeL ?? null : null,
      cargoMaxWeightKg: input.cargoEnabled ? input.cargoMaxWeightKg ?? null : null,
      cargoAllowedTypes: input.cargoEnabled ? (input.cargoAllowedTypes ?? null) : null,
      foodShippingEnabled: input.foodShippingEnabled ?? false,
      foodMaxKg: input.foodShippingEnabled ? input.foodMaxKg ?? null : null,
      foodChilled: input.foodShippingEnabled ? input.foodChilled ?? null : null,
      paymentModel: input.paymentModel ?? 'free',
      paymentAmountIls:
        input.paymentModel === 'expense_share' ? input.paymentAmountIls ?? null : null,
      reqGender: input.reqGender ?? 'any',
      reqSmokingAllowed: input.reqSmokingAllowed ?? false,
      reqPetsAllowed: input.reqPetsAllowed ?? false,
      reqVerifiedOnly: input.reqVerifiedOnly ?? false,
      startedAt: null,
      arrivedAt: null,
      arriveReason: null,
      linkedPostId: input.linkedPostId ?? null,
      foodHandoverToOrg: false,
    };
    this.rows.push(row);
    return row;
  }

  async start(rideId: string): Promise<RideListingRow> {
    const idx = this.rows.findIndex((r) => r.rideId === rideId);
    if (idx < 0) throw new Error('ride_not_found');
    const row = this.rows[idx]!;
    if (row.status === 'in_transit') return row;
    if (row.status !== 'open') throw new Error('invalid_status_transition');
    if (new Date(row.departsAt).getTime() - 30 * 60_000 > Date.now()) {
      throw new Error('start_window_not_open');
    }
    const updated: RideListingRow = { ...row, status: 'in_transit', startedAt: new Date().toISOString() };
    this.rows[idx] = updated;
    return updated;
  }

  async arrive(rideId: string, reason: 'arrived' | 'breakdown'): Promise<RideListingRow> {
    const idx = this.rows.findIndex((r) => r.rideId === rideId);
    if (idx < 0) throw new Error('ride_not_found');
    const row = this.rows[idx]!;
    if (row.status === 'completed_pending_rating') return row;
    if (row.status !== 'in_transit') throw new Error('ride_not_in_transit');
    const updated: RideListingRow = {
      ...row,
      status: 'completed_pending_rating',
      arrivedAt: new Date().toISOString(),
      arriveReason: reason,
    };
    this.rows[idx] = updated;
    return updated;
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

  async updateVisibility(input: {
    rideId: string;
    visibility: RideListingRow['visibility'];
  }): Promise<RideListingRow> {
    const idx = this.rows.findIndex((r) => r.rideId === input.rideId);
    if (idx < 0) throw new Error('ride_not_found');
    const row = this.rows[idx]!;
    if (row.status !== 'open') throw new Error('ride_not_open');
    const updated: RideListingRow = { ...row, visibility: input.visibility };
    this.rows[idx] = updated;
    return updated;
  }

  async listMyRides(input: ListMyRidesInput): Promise<RideListingRow[]> {
    const statuses = input.statuses ?? (['open', 'closed', 'cancelled', 'expired'] as const);
    const sinceTs = input.since === null ? null : input.since
      ? new Date(input.since).getTime()
      : Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.rows
      .filter((r) => r.ownerId === input.ownerId)
      .filter((r) => (statuses as readonly string[]).includes(r.status))
      .filter((r) => (sinceTs === null ? true : new Date(r.departsAt).getTime() >= sinceTs))
      .sort((a, b) => new Date(b.departsAt).getTime() - new Date(a.departsAt).getTime())
      .slice(0, Math.min(input.limit ?? 50, 200));
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
