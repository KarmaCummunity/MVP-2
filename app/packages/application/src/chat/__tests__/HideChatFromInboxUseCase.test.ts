import { describe, it, expect, beforeEach } from 'vitest';
import { HideChatFromInboxUseCase } from '../HideChatFromInboxUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('HideChatFromInboxUseCase', () => {
  let repo: FakeChatRepository;
  let uc: HideChatFromInboxUseCase;

  beforeEach(() => {
    repo = new FakeChatRepository();
    uc = new HideChatFromInboxUseCase(repo);
  });

  it('calls repo hide for the chat id', async () => {
    const chat = await repo.findOrCreateChat('a', 'b');
    await uc.execute({ chatId: chat.chatId });
    expect(repo.inboxHidden.get(chat.chatId)?.has('a')).toBe(true);
  });

  it('rejects support thread hides from fake', async () => {
    const support = await repo.getOrCreateSupportThread('a');
    await expect(uc.execute({ chatId: support.chatId })).rejects.toThrow(
      'support_thread_not_hideable',
    );
  });
});
