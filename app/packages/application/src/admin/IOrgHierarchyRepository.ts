import type { OrgTreeMember } from '@kc/domain';

export interface IOrgHierarchyRepository {
  /** Active grants the caller may see as tree nodes (own org subtree;
   *  super_admin sees all, or a single org when `orgId` is provided). */
  getOrgTree(orgId: string | null): Promise<readonly OrgTreeMember[]>;
  /** Set (or clear, when `managerGrantId` is null) a grant's direct manager. */
  setManager(grantId: string, managerGrantId: string | null): Promise<void>;
}
