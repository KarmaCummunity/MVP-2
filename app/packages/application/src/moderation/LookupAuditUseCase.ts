/** FR-ADMIN-007 — look up the audit trail for a single user. */
import type { AuditEvent } from '@kc/domain';
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';

const DEFAULT_LIMIT = 200;

export interface LookupAuditInput {
  userId: string;
  limit?: number;
}

export class LookupAuditUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: LookupAuditInput): Promise<readonly AuditEvent[]> {
    const limit = input.limit ?? DEFAULT_LIMIT;
    return this.repo.auditLookup(input.userId, limit);
  }
}
