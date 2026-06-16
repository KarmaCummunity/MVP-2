// app/packages/domain/src/admin/AdminPerson.ts
// FR-ADMIN-022 — unified per-user view of admin grants.
//
// The admins list RPC returns one row per grant, so a user holding several
// roles appears multiple times. The UI shows one card per *user* with all
// their roles, so this module folds the flat grant list into `AdminPerson`s.
// Pure domain logic — no I/O, fully unit-tested.
import type { AdminGrant } from './AdminGrant';
import type { AdminRole } from './AdminRole';

/** Authority order: lower index = higher in the hierarchy. Mirrors the
 *  `admin_list_admins` SQL ordering so FE and DB agree on role precedence. */
export const ADMIN_ROLE_ORDER: readonly AdminRole[] = [
  'super_admin', 'moderator', 'support',
  'operators_manager', 'operator',
  'org_admin', 'org_manager', 'volunteer_manager', 'org_employee', 'org_volunteer',
];

export function adminRoleRank(role: AdminRole): number {
  const i = ADMIN_ROLE_ORDER.indexOf(role);
  return i === -1 ? ADMIN_ROLE_ORDER.length : i;
}

export interface AdminPerson {
  readonly userId: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  /** Distinct roles the user currently holds (active grants), highest first. */
  readonly activeRoles: readonly AdminRole[];
  /** Every grant for this user (active + revoked), active first then newest. */
  readonly grants: readonly AdminGrant[];
  readonly lastSeenAt: Date | null;
  readonly hasActiveGrant: boolean;
  /** Top active role for sectioning/sorting; null when fully revoked. */
  readonly highestActiveRole: AdminRole | null;
}

function sortGrants(grants: readonly AdminGrant[]): AdminGrant[] {
  return [...grants].sort((a, b) => {
    const aActive = a.revokedAt === null ? 0 : 1;
    const bActive = b.revokedAt === null ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    const rank = adminRoleRank(a.role) - adminRoleRank(b.role);
    if (rank !== 0) return rank;
    return b.grantedAt.getTime() - a.grantedAt.getTime();
  });
}

function distinctActiveRoles(grants: readonly AdminGrant[]): AdminRole[] {
  const seen = new Set<AdminRole>();
  for (const g of grants) if (g.revokedAt === null) seen.add(g.role);
  return [...seen].sort((a, b) => adminRoleRank(a) - adminRoleRank(b));
}

function latestSeen(grants: readonly AdminGrant[]): Date | null {
  let max: Date | null = null;
  for (const g of grants) {
    if (g.lastSeenAt !== null && (max === null || g.lastSeenAt > max)) max = g.lastSeenAt;
  }
  return max;
}

function toPerson(userId: string, grants: readonly AdminGrant[]): AdminPerson {
  const sorted = sortGrants(grants);
  const activeRoles = distinctActiveRoles(sorted);
  const head = sorted[0];
  return {
    userId,
    displayName: head?.displayName ?? null,
    avatarUrl: head?.avatarUrl ?? null,
    activeRoles,
    grants: sorted,
    lastSeenAt: latestSeen(sorted),
    hasActiveGrant: activeRoles.length > 0,
    highestActiveRole: activeRoles[0] ?? null,
  };
}

function comparePeople(a: AdminPerson, b: AdminPerson): number {
  if (a.hasActiveGrant !== b.hasActiveGrant) return a.hasActiveGrant ? -1 : 1;
  const ra = a.highestActiveRole === null ? Infinity : adminRoleRank(a.highestActiveRole);
  const rb = b.highestActiveRole === null ? Infinity : adminRoleRank(b.highestActiveRole);
  if (ra !== rb) return ra - rb;
  const ta = a.lastSeenAt?.getTime() ?? -1;
  const tb = b.lastSeenAt?.getTime() ?? -1;
  if (ta !== tb) return tb - ta;
  return (a.displayName ?? '').localeCompare(b.displayName ?? '');
}

/** Fold a flat grant list into one `AdminPerson` per user, ordered for display
 *  (active people first by highest role, then fully-revoked people last). */
export function groupGrantsByUser(grants: readonly AdminGrant[]): AdminPerson[] {
  const byUser = new Map<string, AdminGrant[]>();
  for (const g of grants) {
    const bucket = byUser.get(g.userId);
    if (bucket) bucket.push(g);
    else byUser.set(g.userId, [g]);
  }
  const people: AdminPerson[] = [];
  for (const [userId, list] of byUser) people.push(toPerson(userId, list));
  return people.sort(comparePeople);
}
