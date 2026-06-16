import { describe, it, expect } from 'vitest';
import { buildOrgForest, countOrgNodes, type OrgTreeMember } from '../OrgTree';

function member(over: Partial<OrgTreeMember> & { grantId: string }): OrgTreeMember {
  return {
    userId: `u-${over.grantId}`,
    displayName: over.grantId,
    avatarUrl: null,
    role: 'org_volunteer',
    scopeOrgId: 'org-1',
    orgId: 'org-1',
    orgName: 'Org One',
    isPlatform: false,
    managerGrantId: null,
    lastSeenAt: null,
    ...over,
  };
}

describe('buildOrgForest', () => {
  it('returns an empty forest for no members', () => {
    expect(buildOrgForest([])).toEqual([]);
  });

  it('builds a single root at level 0', () => {
    const forest = buildOrgForest([member({ grantId: 'a', role: 'super_admin' })]);
    expect(forest).toHaveLength(1);
    expect(forest[0]!.level).toBe(0);
    expect(forest[0]!.children).toHaveLength(0);
  });

  it('nests children and computes increasing levels', () => {
    const forest = buildOrgForest([
      member({ grantId: 'root', role: 'super_admin', managerGrantId: null }),
      member({ grantId: 'mid', role: 'org_admin', managerGrantId: 'root' }),
      member({ grantId: 'leaf', role: 'org_volunteer', managerGrantId: 'mid' }),
    ]);
    expect(forest).toHaveLength(1);
    const root = forest[0]!;
    expect(root.member.grantId).toBe('root');
    expect(root.level).toBe(0);
    expect(root.children).toHaveLength(1);
    const mid = root.children[0]!;
    expect(mid.level).toBe(1);
    expect(mid.children[0]!.member.grantId).toBe('leaf');
    expect(mid.children[0]!.level).toBe(2);
    expect(countOrgNodes(forest)).toBe(3);
  });

  it('treats a member whose manager is absent from the set as a root', () => {
    const forest = buildOrgForest([
      member({ grantId: 'orphan', managerGrantId: 'not-here' }),
    ]);
    expect(forest).toHaveLength(1);
    expect(forest[0]!.member.grantId).toBe('orphan');
    expect(forest[0]!.level).toBe(0);
  });

  it('supports a multi-root forest sorted by role rank', () => {
    const forest = buildOrgForest([
      member({ grantId: 'vol', role: 'org_volunteer' }),
      member({ grantId: 'sup', role: 'super_admin' }),
    ]);
    expect(forest.map((n) => n.member.grantId)).toEqual(['sup', 'vol']);
  });

  it('sorts siblings by role rank then name', () => {
    const forest = buildOrgForest([
      member({ grantId: 'root', role: 'super_admin' }),
      member({ grantId: 'b-emp', role: 'org_employee', displayName: 'B', managerGrantId: 'root' }),
      member({ grantId: 'a-mgr', role: 'org_manager', displayName: 'A', managerGrantId: 'root' }),
    ]);
    expect(forest[0]!.children.map((c) => c.member.grantId)).toEqual(['a-mgr', 'b-emp']);
  });

  it('does not loop on a cyclic payload (defensive guard)', () => {
    // a -> b -> a is impossible via the RPC, but the builder must not hang.
    const forest = buildOrgForest([
      member({ grantId: 'a', managerGrantId: 'b' }),
      member({ grantId: 'b', managerGrantId: 'a' }),
    ]);
    // Both reference each other, so neither is a root → empty forest, no hang.
    expect(forest).toEqual([]);
  });
});
