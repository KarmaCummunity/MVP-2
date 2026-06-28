// FR-RIDE-022 — owner transitions a template through the status machine.
//
// Valid transitions:
//   active   → paused | archived
//   paused   → active | archived
//   archived → (terminal)
import { RideError } from '@kc/domain';
import type { RideTemplate, RideTemplateStatus } from '@kc/domain';
import type { IRideTemplateRepository } from '../ports/IRideTemplateRepository';

const ALLOWED: Record<RideTemplateStatus, ReadonlySet<RideTemplateStatus>> = {
  active: new Set<RideTemplateStatus>(['paused', 'archived']),
  paused: new Set<RideTemplateStatus>(['active', 'archived']),
  archived: new Set<RideTemplateStatus>(),
};

export class SetRideTemplateStatusUseCase {
  constructor(private readonly repo: IRideTemplateRepository) {}

  async execute(input: {
    templateId: string;
    status: RideTemplateStatus;
  }): Promise<RideTemplate> {
    const current = await this.repo.getById(input.templateId);
    if (!current) throw new RideError('template_not_found', 'template_not_found');
    if (current.status === input.status) return current;
    if (!ALLOWED[current.status].has(input.status)) {
      throw new RideError('invalid_visibility', `cannot transition ${current.status} → ${input.status}`);
    }
    return this.repo.setStatus(input.templateId, input.status);
  }
}
