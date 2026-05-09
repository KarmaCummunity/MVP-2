import { describe, it, expect } from 'vitest';
import { BlockUserUseCase } from '../BlockUserUseCase';
import { FakeBlockRepository } from './fakeBlockRepository';

describe('BlockUserUseCase', () => {
  it('blocks another user', async () => {
    const repo = new FakeBlockRepository();
    await new BlockUserUseCase(repo).execute({ blockerId: 'a', blockedId: 'b' });
    expect(await repo.isBlockedByMe('a', 'b')).toBe(true);
  });

  it('rejects self-block', async () => {
    const repo = new FakeBlockRepository();
    await expect(
      new BlockUserUseCase(repo).execute({ blockerId: 'a', blockedId: 'a' }),
    ).rejects.toMatchObject({ code: 'self_block_forbidden' });
  });
});
