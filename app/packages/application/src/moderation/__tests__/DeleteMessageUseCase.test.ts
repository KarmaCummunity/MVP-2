import { describe, it, expect } from 'vitest';
import { DeleteMessageUseCase } from '../DeleteMessageUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('DeleteMessageUseCase', () => {
  it('forwards messageId to repo.deleteMessage', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new DeleteMessageUseCase(repo);

    await uc.execute({ messageId: 'm_1' });

    expect(repo.deleteMessageCalls).toEqual(['m_1']);
  });
});
