import type { IBlockRepository } from '../../ports/IBlockRepository';

export class FakeBlockRepository implements IBlockRepository {
  pairs: Array<{ blocker: string; blocked: string }> = [];
  async block(blockerId: string, blockedId: string) {
    this.pairs.push({ blocker: blockerId, blocked: blockedId });
  }
  async unblock(blockerId: string, blockedId: string) {
    this.pairs = this.pairs.filter((p) => !(p.blocker === blockerId && p.blocked === blockedId));
  }
  async isBlockedByMe(viewerId: string, otherId: string) {
    return this.pairs.some((p) => p.blocker === viewerId && p.blocked === otherId);
  }
}
