import { describe, it, expect } from 'vitest';
import { MarkChatReadUseCase } from '../MarkChatReadUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('MarkChatReadUseCase', () => {
  it('zeroes out the unread counter for the given chat', async () => {
    const repo = new FakeChatRepository();
    repo.unread = { c1: 4, c2: 1 };
    const uc = new MarkChatReadUseCase(repo);

    await uc.execute({ chatId: 'c1', userId: 'u_me' });

    expect(repo.unread['c1']).toBe(0);
    // Sibling chats are untouched.
    expect(repo.unread['c2']).toBe(1);
  });

  it('is a no-op when the chat is already at zero unread', async () => {
    const repo = new FakeChatRepository();
    repo.unread = { c1: 0 };
    const uc = new MarkChatReadUseCase(repo);

    await uc.execute({ chatId: 'c1', userId: 'u_me' });

    expect(repo.unread['c1']).toBe(0);
  });
});
