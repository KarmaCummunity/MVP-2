import { DomainError } from '../errors';

export type RideErrorCode =
  | 'same_route'
  | 'origin_street_required'
  | 'dest_street_required'
  | 'seats_required'
  | 'seats_forbidden'
  | 'description_too_long'
  | 'city_not_found'
  | 'auth_required'
  | 'invalid_visibility'
  | 'ride_not_found'
  | 'not_ride_owner'
  | 'ride_not_open';

export class RideError extends DomainError {
  readonly code: RideErrorCode;

  constructor(code: RideErrorCode, message: string) {
    super(message, { code });
    this.code = code;
  }
}
