// FR-RIDE-012 — participant cancels their own request/approved seat.
import type { RideParticipant } from '@kc/domain';
import type { IRideParticipantRepository } from '../ports/IRideParticipantRepository';

export interface CancelRideJoinInput {
  readonly participantId: string;
}

export class CancelRideJoinUseCase {
  constructor(private readonly repo: IRideParticipantRepository) {}

  async execute(input: CancelRideJoinInput): Promise<RideParticipant> {
    return this.repo.cancel({ participantId: input.participantId });
  }
}
