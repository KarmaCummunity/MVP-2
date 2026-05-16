import { describe, it, expect } from 'vitest';
import { GetUnreadTotalUseCase } from '../GetUnreadTotalUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('GetUnreadTotalUseCase', () => {
  it('returns 0 when there are no unread messages', async () => {
    const repo = new FakeChatRepository();
    const uc = new GetUnreadTotalUseCase(repo);

    expect(await uc.execute({ userId: 'u_me' })).toBe(0);
  });

  it('returns the sum across all chats', async () => {
    const repo = new FakeChatRepository();
    repo.unread = { c1: 2, c2: 3, c3: 0 };
    const uc = new GetUnreadTotalUseCase(repo);

    expect(await uc.execute({ userId: 'u_me' })).toBe(5);
  });
});
