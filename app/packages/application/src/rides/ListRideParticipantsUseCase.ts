// FR-RIDE-012 — list every participant row for a ride.
// RLS scopes the result: the ride owner gets every row, non-owners get only
// their own row (if any). The use case is a thin pass-through.
import type { RideParticipant } from '@kc/domain';
import type { IRideParticipantRepository } from '../ports/IRideParticipantRepository';

export interface ListRideParticipantsInput {
  readonly rideId: string;
}

export class ListRideParticipantsUseCase {
  constructor(private readonly repo: IRideParticipantRepository) {}

  async execute(input: ListRideParticipantsInput): Promise<readonly RideParticipant[]> {
    return this.repo.listForRide({ rideId: input.rideId });
  }
}
