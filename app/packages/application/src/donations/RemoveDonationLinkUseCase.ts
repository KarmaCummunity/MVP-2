import type { IDonationLinksRepository } from '../ports/IDonationLinksRepository';

/** Deletes a donation link row. Authorization (own-row or super-admin) is
 *  enforced by RLS — the repo issues DELETE and the policy rejects
 *  unauthorized callers. */
export class RemoveDonationLinkUseCase {
  constructor(private readonly repo: IDonationLinksRepository) {}

  execute(linkId: string): Promise<void> {
    return this.repo.deleteById(linkId);
  }
}
