// FR-ORG-002/004 — port for reading the current user's organizations.
import type { Organization } from '@kc/domain';

export interface IOrganizationRepository {
  /** Organizations the current user is a member of, default first. */
  listMine(): Promise<readonly Organization[]>;
}
