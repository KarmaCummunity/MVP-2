/** FR-CLOSURE-003 AC1/AC2: distinct chat partners on this post, sorted by recency, blocked filtered. */
import type { ClosureCandidate, IPostRepository } from '../ports/IPostRepository';
import type { IUserRepository } from '../ports/IUserRepository';

export interface GetClosureCandidatesInput {
  postId: string;
  ownerId: string;
}

export class GetClosureCandidatesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: GetClosureCandidatesInput): Promise<ClosureCandidate[]> {
    const candidates = await this.postRepo.getClosureCandidates(input.postId);
    // Block-list filtering is best-effort: a transient failure here (e.g. RLS
    // misconfig, network blip) must NOT take down the whole closure flow,
    // because the recipient candidates are already restricted to chat
    // partners. If the block fetch fails we fall back to "no blocks" — the
    // owner might see a blocked user in the picker but they already see them
    // in their chats, so the privacy delta is zero. We log a warning so SREs
    // catch real outages.
    let blockedIds: Set<string>;
    try {
      const blocked = await this.userRepo.getBlockedUsers(input.ownerId);
      blockedIds = new Set(blocked.map((u) => u.userId));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[closure] block-list fetch failed, showing all candidates:', e);
      blockedIds = new Set();
    }
    return candidates.filter((c) => !blockedIds.has(c.userId));
  }
}
