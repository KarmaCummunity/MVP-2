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
  visibility: 'Public';
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

export interface IRideListingRepository {
  create(input: CreateRideListingRepoInput): Promise<RideListingRow>;
  getById(rideId: string, viewerId: string): Promise<RideListingRow | null>;
  search(input: SearchRideListingsInput): Promise<RideListingRow[]>;
  close(rideId: string, ownerId: string, status: 'closed' | 'cancelled'): Promise<void>;
}
