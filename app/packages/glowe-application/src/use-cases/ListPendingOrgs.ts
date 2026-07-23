import type { GloweProfile } from '../ports/IGloweProfileRepository';
import type { IGloweAdminGateway } from '../ports/IGloweAdminGateway';

export interface ListPendingOrgsDeps {
  readonly admin: IGloweAdminGateway;
}

export type ListPendingOrgsResult =
  | { readonly ok: true; readonly orgs: readonly GloweProfile[] }
  | { readonly ok: false; readonly forbidden: true; readonly error: string }
  | { readonly ok: false; readonly error: string };

function isForbiddenError(
  error: { readonly code?: string; readonly message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === '42501') return true;
  return /forbidden|permission/i.test(String(error.message ?? ''));
}

export async function listPendingOrgs(
  deps: ListPendingOrgsDeps,
): Promise<ListPendingOrgsResult> {
  try {
    const rows = await deps.admin.listPendingOrgs();
    return { ok: true, orgs: rows ?? [] };
  } catch (err) {
    if (isForbiddenError(err as { code?: string; message?: string })) {
      return {
        ok: false,
        forbidden: true,
        error: 'Only GloWe reviewers can view the organization queue.',
      };
    }
    return { ok: false, error: 'Could not load the organization queue.' };
  }
}
