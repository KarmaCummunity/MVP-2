import { describe, it, expect } from 'vitest';
import { GetSupportThreadUseCase } from '../GetSupportThreadUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('GetSupportThreadUseCase', () => {
  it('returns a fresh support thread for a first-time caller', async () => {
    const repo = new FakeChatRepository();
    const uc = new GetSupportThreadUseCase(repo);

    const chat = await uc.execute({ userId: 'u_me' });

    expect(chat.isSupportThread).toBe(true);
    expect(chat.participantIds).toContain('u_me');
    expect(chat.participantIds).toContain('super-admin');
  });

  it('returns the same thread on repeat calls (get-or-create idempotent)', async () => {
    const repo = new FakeChatRepository();
    const uc = new GetSupportThreadUseCase(repo);

    const first = await uc.execute({ userId: 'u_me' });
    const second = await uc.execute({ userId: 'u_me' });

    expect(second.chatId).toBe(first.chatId);
  });

  it('returns distinct threads for different users', async () => {
    const repo = new FakeChatRepository();
    const uc = new GetSupportThreadUseCase(repo);

    const aThread = await uc.execute({ userId: 'u_a' });
    const bThread = await uc.execute({ userId: 'u_b' });

    expect(aThread.chatId).not.toBe(bThread.chatId);
  });
});
