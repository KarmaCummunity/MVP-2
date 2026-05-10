import type { IDonationLinksRepository } from '../ports/IDonationLinksRepository';

/** Soft-hides a donation link. Authorization (own-row or super-admin) is
 *  enforced by RLS — the repo issues an UPDATE and the policy rejects
 *  unauthorized callers. */
export class RemoveDonationLinkUseCase {
  constructor(private readonly repo: IDonationLinksRepository) {}

  execute(linkId: string): Promise<void> {
    return this.repo.softHide(linkId);
  }
}
