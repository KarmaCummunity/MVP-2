/** FR-CHAT-009 / D-11 — paired unblock. */
import type { IBlockRepository } from '../ports/IBlockRepository';

export class UnblockUserUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(input: { blockerId: string; blockedId: string }): Promise<void> {
    await this.repo.unblock(input.blockerId, input.blockedId);
  }
}
