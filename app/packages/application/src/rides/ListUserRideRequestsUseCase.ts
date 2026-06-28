// FR-RIDE-012 — list participant rows the caller owns, recent first.
// Drives the future "my ride requests" rider surface.
import type { RideParticipant } from '@kc/domain';
import type { IRideParticipantRepository } from '../ports/IRideParticipantRepository';

const DEFAULT_LIMIT = 30;

export interface ListUserRideRequestsInput {
  readonly userId: string;
  readonly limit?: number;
}

export class ListUserRideRequestsUseCase {
  constructor(private readonly repo: IRideParticipantRepository) {}

  async execute(input: ListUserRideRequestsInput): Promise<readonly RideParticipant[]> {
    return this.repo.listForUser({
      userId: input.userId,
      limit: input.limit ?? DEFAULT_LIMIT,
    });
  }
}
