// FR-RIDE-022 — owner deletes a template (hard). Historical ride_listings
// rows are preserved (FK ON DELETE SET NULL).
import { RideError } from '@kc/domain';
import type { IRideTemplateRepository } from '../ports/IRideTemplateRepository';

export class DeleteRideTemplateUseCase {
  constructor(private readonly repo: IRideTemplateRepository) {}

  async execute(input: { templateId: string }): Promise<void> {
    const current = await this.repo.getById(input.templateId);
    if (!current) throw new RideError('template_not_found', 'template_not_found');
    await this.repo.delete(input.templateId);
  }
}
