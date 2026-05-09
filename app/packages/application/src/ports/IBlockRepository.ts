export interface IBlockRepository {
  block(blockerId: string, blockedId: string): Promise<void>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
  isBlockedByMe(viewerId: string, otherId: string): Promise<boolean>;
}
