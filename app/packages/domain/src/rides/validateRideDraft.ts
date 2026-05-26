import type { RideMode } from './RideMode';
import { RideError } from './RideError';

export interface RideDraftInput {
  mode: RideMode;
  originCityId: string;
  destCityId: string;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
}

export function validateRideDraft(input: RideDraftInput): void {
  if (input.originCityId === input.destCityId) {
    throw new RideError('same_cities', 'origin and destination must differ');
  }
  if (input.mode === 'offer' && input.seatsAvailable == null) {
    throw new RideError('seats_required', 'offer listings require seats');
  }
  if (input.mode === 'request' && input.seatsAvailable != null) {
    throw new RideError('seats_forbidden', 'request listings cannot have seats');
  }
}
