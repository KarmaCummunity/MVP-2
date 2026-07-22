// FR-GLOWE-003 — Write gate for content creation (pure domain).

import type { GloweProfileGate } from './createSystem';

export type WriteGateReason = 'ok' | 'anon' | 'org-unverified';

export interface WriteGateResult {
  readonly allowed: boolean;
  readonly reason: WriteGateReason;
}

function isOrganization(profile: GloweProfileGate): boolean {
  return (
    profile.accountType === 'organization' || profile.type === 'organization'
  );
}

export function writeGate(
  profile: GloweProfileGate | null,
  loggedIn: boolean,
): WriteGateResult {
  if (!loggedIn) return { allowed: false, reason: 'anon' };
  const p = profile ?? {};
  if (
    isOrganization(p) &&
    p.approvalStatus &&
    p.approvalStatus !== 'approved'
  ) {
    return { allowed: false, reason: 'org-unverified' };
  }
  return { allowed: true, reason: 'ok' };
}

export function canCreateContent(
  profile: GloweProfileGate | null,
  loggedIn: boolean,
): boolean {
  return writeGate(profile, loggedIn).allowed;
}
