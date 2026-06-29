import { buildOrgForest, type OrgTreeNode } from '@kc/domain';
import type { IOrgHierarchyRepository } from './IOrgHierarchyRepository';

export interface GetOrgTreeInput {
  /** Restrict to a single org; null = caller's full visible scope. */
  readonly orgId: string | null;
}

export class GetOrgTreeUseCase {
  constructor(private readonly repo: IOrgHierarchyRepository) {}

  async execute(input: GetOrgTreeInput): Promise<OrgTreeNode[]> {
    const members = await this.repo.getOrgTree(input.orgId);
    return buildOrgForest(members);
  }
}
