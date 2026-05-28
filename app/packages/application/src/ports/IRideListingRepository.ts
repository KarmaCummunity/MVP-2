export interface RideListingRow {
  rideId: string;
  ownerId: string;
  mode: 'offer' | 'request';
  originCityId: string;
  destCityId: string;
  originCityName: string;
  destCityName: string;
  originStreet: string;
  originStreetNumber: string | null;
  destStreet: string;
  destStreetNumber: string | null;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
  title: string;
  status: 'open' | 'closed' | 'cancelled' | 'expired';
  visibility: 'Public' | 'FollowersOnly' | 'OnlyMe';
  createdAt: string;
  updatedAt: string;
}

export type RideVisibility = 'Public' | 'FollowersOnly' | 'OnlyMe';

export interface CreateRideListingRepoInput {
  ownerId: string;
  mode: 'offer' | 'request';
  originCityId: string;
  destCityId: string;
  originStreet: string;
  originStreetNumber: string | null;
  destStreet: string;
  destStreetNumber: string | null;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
  title: string;
  visibility: RideVisibility;
}

export interface SearchRideListingsInput {
  viewerId: string;
  query?: string | null;
  originCityId?: string | null;
  destCityId?: string | null;
  mode?: 'offer' | 'request' | null;
  departFrom?: string | null;
  departTo?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface FindRideMatchesInput {
  rideId: string;
  /** Window in hours around the source ride's departs_at. Clamped server-side to [1, 72]; default 12. */
  windowHours?: number | null;
  /** Result cap. Clamped server-side to [1, 50]; default 20. */
  limit?: number | null;
}

export interface IRideListingRepository {
  create(input: CreateRideListingRepoInput): Promise<RideListingRow>;
  getById(rideId: string, viewerId: string): Promise<RideListingRow | null>;
  search(input: SearchRideListingsInput): Promise<RideListingRow[]>;
  close(rideId: string, ownerId: string, status: 'closed' | 'cancelled'): Promise<void>;
  /**
   * Inverse-mode matches for a ride the caller owns. Server only returns
   * rides with the inverse `mode`, same origin/dest cities, status='open',
   * visibility='Public', and `departs_at` within ±windowHours of the source.
   */
  findMatches(input: FindRideMatchesInput): Promise<RideListingRow[]>;
}
