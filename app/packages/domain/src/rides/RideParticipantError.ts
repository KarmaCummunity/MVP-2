// FR-RIDE-011 — typed domain error for participant flows.
import { DomainError } from '../errors';

export type RideParticipantErrorCode =
  | 'auth_required'
  | 'ride_not_found'
  | 'ride_not_joinable'
  | 'cannot_join_own_ride'
  | 'already_requested'
  | 'participant_not_found'
  | 'participant_not_pending'
  | 'not_ride_owner'
  | 'not_participant'
  | 'ride_not_open'
  | 'ride_full'
  | 'invalid_status'
  | 'cannot_cancel_rejected'
  | 'note_too_long';

export class RideParticipantError extends DomainError {
  readonly code: RideParticipantErrorCode;

  constructor(code: RideParticipantErrorCode, message?: string) {
    super(message ?? code, { code });
    this.code = code;
  }
}
