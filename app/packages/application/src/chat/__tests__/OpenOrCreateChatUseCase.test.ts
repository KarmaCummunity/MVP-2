import { describe, it, expect, beforeEach } from 'vitest';
import { OpenOrCreateChatUseCase } from '../OpenOrCreateChatUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('OpenOrCreateChatUseCase', () => {
  let repo: FakeChatRepository;
  let uc: OpenOrCreateChatUseCase;
  beforeEach(() => {
    repo = new FakeChatRepository();
    uc = new OpenOrCreateChatUseCase(repo);
  });

  it('creates a new chat when none exists', async () => {
    const chat = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    expect(chat.anchorPostId).toBe('p1');
    expect(repo.chats).toHaveLength(1);
  });

  it('returns the existing chat (first-anchor-wins) on second call', async () => {
    await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    const second = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p2' });
    expect(second.anchorPostId).toBe('p1');
    expect(repo.chats).toHaveLength(1);
  });

  it('handles no-anchor entry (profile flow)', async () => {
    const chat = await uc.execute({ viewerId: 'a', otherUserId: 'b' });
    expect(chat.anchorPostId).toBeNull();
  });
});
