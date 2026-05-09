/** FR-CHAT-009 entry — viewer-initiated block from chat ⋮ menu. */
import type { IBlockRepository } from '../ports/IBlockRepository';
import { BlockError } from './errors';

export class BlockUserUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(input: { blockerId: string; blockedId: string }): Promise<void> {
    if (input.blockerId === input.blockedId) {
      throw new BlockError('self_block_forbidden', 'self_block_forbidden');
    }
    await this.repo.block(input.blockerId, input.blockedId);
  }
}
