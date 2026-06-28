// FR-RIDE-012 — ride owner approves or rejects a pending request.
import { RideParticipantError } from '@kc/domain';
import type { RideParticipant } from '@kc/domain';
import type { IRideParticipantRepository } from '../ports/IRideParticipantRepository';

export interface DecideRideJoinInput {
  readonly participantId: string;
  readonly status: 'approved' | 'rejected';
}

export class DecideRideJoinUseCase {
  constructor(private readonly repo: IRideParticipantRepository) {}

  async execute(input: DecideRideJoinInput): Promise<RideParticipant> {
    if (input.status !== 'approved' && input.status !== 'rejected') {
      throw new RideParticipantError('invalid_status');
    }
    return this.repo.decide({ participantId: input.participantId, status: input.status });
  }
}
