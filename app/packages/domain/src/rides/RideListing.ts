import type { RideMode } from './RideMode';
import type { RideStatus } from './RideStatus';
import type { PostVisibility } from '../value-objects';

export interface RideListing {
  readonly rideId: string;
  readonly ownerId: string;
  readonly mode: RideMode;
  readonly originCityId: string;
  readonly destCityId: string;
  readonly originCityName: string;
  readonly destCityName: string;
  readonly departsAt: string;
  readonly seatsAvailable: number | null;
  readonly description: string | null;
  readonly title: string;
  readonly status: RideStatus;
  readonly visibility: PostVisibility;
  readonly createdAt: string;
  readonly updatedAt: string;
}
