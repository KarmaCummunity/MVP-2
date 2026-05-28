// FR-RIDE-022 — list templates owned by the caller.
import type { RideTemplate } from '@kc/domain';
import type { IRideTemplateRepository } from '../ports/IRideTemplateRepository';

export class ListMyRideTemplatesUseCase {
  constructor(private readonly repo: IRideTemplateRepository) {}

  async execute(input: { ownerId: string }): Promise<readonly RideTemplate[]> {
    return this.repo.listForOwner(input.ownerId);
  }
}
