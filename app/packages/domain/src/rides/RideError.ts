import { DomainError } from '../errors';

export type RideErrorCode =
  | 'same_route'
  | 'origin_street_required'
  | 'dest_street_required'
  | 'seats_required'
  | 'seats_forbidden'
  | 'description_too_long'
  | 'city_not_found';

export class RideError extends DomainError {
  readonly code: RideErrorCode;

  constructor(code: RideErrorCode, message: string) {
    super(message, { code });
    this.code = code;
  }
}
