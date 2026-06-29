// app/apps/mobile/src/hooks/useOrgTree.ts
// FR-ADMIN-025 — org hierarchy tree for the admins screen + detail.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OrgTreeMember, OrgTreeNode } from '@kc/domain';
import { container } from '../lib/container';

const EMPTY: readonly OrgTreeNode[] = [];

export interface OrgTreeState {
  readonly forest: readonly OrgTreeNode[];
  /** Flat list of every node's member (handy for lookups on the detail screen). */
  readonly members: readonly OrgTreeMember[];
  readonly isLoading: boolean;
  readonly isRefetching: boolean;
  readonly refetch: () => void;
  readonly error: unknown;
}

function flatten(forest: readonly OrgTreeNode[], out: OrgTreeMember[]): void {
  for (const node of forest) {
    out.push(node.member);
    flatten(node.children, out);
  }
}

export function useOrgTree(orgId: string | null, enabled = true): OrgTreeState {
  const q = useQuery({
    queryKey: ['admin.org.tree', { orgId }],
    queryFn: () => container.getOrgTree.execute({ orgId }),
    enabled,
    staleTime: 30_000,
  });
  const forest = q.data ?? EMPTY;
  const members = useMemo(() => {
    const out: OrgTreeMember[] = [];
    flatten(forest, out);
    return out;
  }, [forest]);
  return {
    forest,
    members,
    isLoading: q.isLoading,
    isRefetching: q.isRefetching,
    refetch: () => { void q.refetch(); },
    error: q.error,
  };
}
