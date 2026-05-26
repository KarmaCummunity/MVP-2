import type { RideMode } from './RideMode';
import { RideError } from './RideError';

export interface RideDraftInput {
  mode: RideMode;
  originCityId: string;
  destCityId: string;
  originStreet: string;
  destStreet: string;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
}

export function validateRideDraft(input: RideDraftInput): void {
  const originStreet = input.originStreet.trim();
  const destStreet = input.destStreet.trim();
  if (!originStreet || originStreet.length > 80) {
    throw new RideError('origin_street_required', 'origin street required');
  }
  if (!destStreet || destStreet.length > 80) {
    throw new RideError('dest_street_required', 'destination street required');
  }
  if (
    input.originCityId === input.destCityId &&
    originStreet === destStreet
  ) {
    throw new RideError('same_route', 'origin and destination must differ');
  }
  if (input.mode === 'offer' && input.seatsAvailable == null) {
    throw new RideError('seats_required', 'offer listings require seats');
  }
  if (input.mode === 'request' && input.seatsAvailable != null) {
    throw new RideError('seats_forbidden', 'request listings cannot have seats');
  }
}
