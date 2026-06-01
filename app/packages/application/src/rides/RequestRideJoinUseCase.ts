// FR-RIDE-012 — caller requests to join a ride.
import { RideParticipantError } from '@kc/domain';
import type { RideParticipant } from '@kc/domain';
import type { IRideParticipantRepository } from '../ports/IRideParticipantRepository';

const NOTE_MAX = 500;

export interface RequestRideJoinInput {
  readonly rideId: string;
  readonly note: string | null;
}

export class RequestRideJoinUseCase {
  constructor(private readonly repo: IRideParticipantRepository) {}

  async execute(input: RequestRideJoinInput): Promise<RideParticipant> {
    if (input.note !== null && input.note.length > NOTE_MAX) {
      throw new RideParticipantError('note_too_long');
    }
    return this.repo.request({ rideId: input.rideId, note: input.note });
  }
}
