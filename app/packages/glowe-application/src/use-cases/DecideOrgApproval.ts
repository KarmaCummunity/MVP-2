import type { GloweProfile } from '../ports/IGloweProfileRepository';
import type {
  IGloweAdminGateway,
  OrgApprovalDecision,
} from '../ports/IGloweAdminGateway';

export interface DecideOrgApprovalDeps {
  readonly admin: IGloweAdminGateway;
}

export interface DecideOrgApprovalInput {
  readonly profileId: string;
  readonly decision: OrgApprovalDecision;
  readonly note?: string;
}

export type DecideOrgApprovalResult =
  | { readonly ok: true; readonly profile: GloweProfile }
  | { readonly ok: false; readonly forbidden: true; readonly error: string }
  | { readonly ok: false; readonly error: string };

const VALID_DECISIONS = new Set<OrgApprovalDecision>(['approved', 'rejected']);

function isForbiddenError(
  error: { readonly code?: string; readonly message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === '42501') return true;
  return /forbidden|permission/i.test(String(error.message ?? ''));
}

function validateInput(input: DecideOrgApprovalInput): string | null {
  const profileId = String(input.profileId || '').trim();
  if (!profileId) return 'Missing organization.';

  const decision = String(input.decision || '').trim() as OrgApprovalDecision;
  if (!VALID_DECISIONS.has(decision)) return 'Invalid decision.';

  const note = String(input.note ?? '').trim();
  if (decision === 'rejected' && !note) return 'Rejection reason required.';

  return null;
}

export async function decideOrgApproval(
  deps: DecideOrgApprovalDeps,
  input: DecideOrgApprovalInput,
): Promise<DecideOrgApprovalResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const profileId = String(input.profileId).trim();
  const decision = String(input.decision).trim() as OrgApprovalDecision;
  const note = String(input.note ?? '').trim();

  try {
    const profile = await deps.admin.setOrgApproval(profileId, decision, note);
    if (!profile) {
      return { ok: false, error: 'Could not save decision.' };
    }
    return { ok: true, profile };
  } catch (err) {
    if (isForbiddenError(err as { code?: string; message?: string })) {
      return {
        ok: false,
        forbidden: true,
        error: 'Only GloWe reviewers can approve or reject organizations.',
      };
    }
    return { ok: false, error: 'Could not save decision.' };
  }
}
