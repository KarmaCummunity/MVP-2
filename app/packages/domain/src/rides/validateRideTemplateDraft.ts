// FR-RIDE-021 — domain validation for a ride template draft.
//
// Mirrors validateRideDraft (cities differ or streets differ; seats by mode)
// and adds the recurrence-specific invariants (mask + lookahead).
import { RideError } from './RideError';

export interface RideTemplateDraft {
  mode: 'offer' | 'request';
  originCityId: string;
  destCityId: string;
  originStreet: string;
  destStreet: string;
  weekdayMask: number;
  seatsAvailable: number | null;
  description: string | null;
  lookaheadDays: number;
}

export function validateRideTemplateDraft(d: RideTemplateDraft): void {
  if (
    d.originCityId === d.destCityId &&
    d.originStreet.trim() === d.destStreet.trim()
  ) {
    throw new RideError('same_route', 'origin and destination are identical');
  }
  if (!d.originStreet || d.originStreet.trim().length === 0) {
    throw new RideError('origin_street_required', 'origin_street_required');
  }
  if (!d.destStreet || d.destStreet.trim().length === 0) {
    throw new RideError('dest_street_required', 'dest_street_required');
  }
  if (d.mode === 'offer' && d.seatsAvailable === null) {
    throw new RideError('seats_required', 'seats_required');
  }
  if (d.mode === 'request' && d.seatsAvailable !== null) {
    throw new RideError('seats_forbidden', 'seats_forbidden');
  }
  if (d.description && d.description.length > 500) {
    throw new RideError('description_too_long', 'description_too_long');
  }
  if (!Number.isInteger(d.weekdayMask) || d.weekdayMask < 1 || d.weekdayMask > 127) {
    throw new RideError('invalid_weekday_mask', 'weekday_mask must be 1..127');
  }
  if (
    !Number.isInteger(d.lookaheadDays) ||
    d.lookaheadDays < 1 ||
    d.lookaheadDays > 30
  ) {
    throw new RideError('invalid_lookahead_days', 'lookahead_days must be 1..30');
  }
}
