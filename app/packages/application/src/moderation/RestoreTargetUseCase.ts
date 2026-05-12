/** FR-ADMIN-002 — restore a previously removed target. */
import type {
  IModerationAdminRepository,
  ModerationTargetType,
} from '../ports/IModerationAdminRepository';

export interface RestoreTargetInput {
  targetType: ModerationTargetType;
  targetId: string;
}

export class RestoreTargetUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: RestoreTargetInput): Promise<void> {
    await this.repo.restoreTarget(input.targetType, input.targetId);
  }
}
