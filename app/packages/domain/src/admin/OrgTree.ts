// app/packages/domain/src/admin/OrgTree.ts
// FR-ADMIN-025 — direct-manager hierarchy tree.
//
// `admin_org_tree` returns a flat adjacency list (one row per active grant with
// its `managerGrantId`). This module folds that list into a forest of
// `OrgTreeNode`s with a computed `level` (depth from the root). Pure domain
// logic — no I/O, fully unit-tested. Cycles cannot occur (the assign-manager
// RPC rejects them) but the builder guards against them defensively so a
// malformed payload can never loop.
import type { AdminRole } from './AdminRole';
import { adminRoleRank } from './AdminPerson';

export interface OrgTreeMember {
  readonly grantId: string;
  readonly userId: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly role: AdminRole;
  readonly scopeOrgId: string | null;
  /** Effective org: scopeOrgId, or the platform org for platform roles. */
  readonly orgId: string | null;
  readonly orgName: string | null;
  readonly isPlatform: boolean;
  readonly managerGrantId: string | null;
  readonly lastSeenAt: Date | null;
}

export interface OrgTreeNode {
  readonly member: OrgTreeMember;
  /** Depth from a root node (root = 0). */
  readonly level: number;
  readonly children: readonly OrgTreeNode[];
}

function sortMembers(a: OrgTreeMember, b: OrgTreeMember): number {
  const rank = adminRoleRank(a.role) - adminRoleRank(b.role);
  if (rank !== 0) return rank;
  return (a.displayName ?? '').localeCompare(b.displayName ?? '');
}

/** A grant is a root when it has no manager, or its manager is absent from the
 *  visible set (e.g. an out-of-org manager the caller may not see). */
function isRoot(member: OrgTreeMember, present: ReadonlySet<string>): boolean {
  return member.managerGrantId === null || !present.has(member.managerGrantId);
}

function buildNode(
  member: OrgTreeMember,
  level: number,
  childrenOf: ReadonlyMap<string, OrgTreeMember[]>,
  visited: ReadonlySet<string>,
): OrgTreeNode {
  const guard = new Set(visited).add(member.grantId);
  const kids = (childrenOf.get(member.grantId) ?? [])
    .filter((c) => !guard.has(c.grantId))
    .sort(sortMembers)
    .map((c) => buildNode(c, level + 1, childrenOf, guard));
  return { member, level, children: kids };
}

/** Fold a flat adjacency list into a sorted forest with computed levels. */
export function buildOrgForest(members: readonly OrgTreeMember[]): OrgTreeNode[] {
  const present = new Set(members.map((m) => m.grantId));
  const childrenOf = new Map<string, OrgTreeMember[]>();
  for (const m of members) {
    if (m.managerGrantId !== null && present.has(m.managerGrantId)) {
      const bucket = childrenOf.get(m.managerGrantId);
      if (bucket) bucket.push(m);
      else childrenOf.set(m.managerGrantId, [m]);
    }
  }
  return members
    .filter((m) => isRoot(m, present))
    .sort(sortMembers)
    .map((m) => buildNode(m, 0, childrenOf, new Set<string>()));
}

/** Total node count across a forest (handy for empty-state checks + tests). */
export function countOrgNodes(forest: readonly OrgTreeNode[]): number {
  let n = 0;
  for (const node of forest) n += 1 + countOrgNodes(node.children);
  return n;
}
