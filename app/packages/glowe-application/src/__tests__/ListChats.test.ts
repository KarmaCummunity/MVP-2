import { describe, expect, it, vi } from 'vitest';

import type { IGloweChatGateway } from '../ports/IGloweChatGateway';
import { listChats } from '../use-cases/ListChats';

const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';

function makeChatGateway(
  overrides: Partial<IGloweChatGateway>,
): IGloweChatGateway {
  return {
    getOrCreateDmChat: vi.fn(async () => null),
    listMyChats: vi.fn(async () => []),
    lastMessages: vi.fn(async () => []),
    unreadCounts: vi.fn(async () => []),
    unreadTotal: vi.fn(async () => 0),
    getMessages: vi.fn(async () => []),
    sendMessage: vi.fn(async () => null),
    markChatRead: vi.fn(async () => null),
    counterpartProfiles: vi.fn(async () => ({})),
    ...overrides,
  };
}

describe('listChats', () => {
  it('returns an empty inbox when viewerId is missing', async () => {
    const result = await listChats(
      { chat: makeChatGateway({}) },
      { viewerId: '' },
    );

    expect(result).toEqual({ chats: [], profiles: {} });
  });

  it('maps, filters, and enriches inbox chats with previews and unread counts', async () => {
    const listMyChats = vi.fn(async () => [
      {
        chat_id: 'c1',
        participant_a: ME,
        participant_b: OTHER,
        last_message_at: '2026-07-02T10:00:00Z',
      },
      {
        chat_id: 'c2',
        participant_a: ME,
        participant_b: OTHER,
        last_message_at: '2026-07-01T10:00:00Z',
      },
    ]);
    const lastMessages = vi.fn(async () => [
      {
        message_id: 'm1',
        chat_id: 'c1',
        sender_id: OTHER,
        kind: 'user',
        body: 'Hello',
        created_at: '2026-07-02T11:00:00Z',
      },
    ]);
    const unreadCounts = vi.fn(async () => [{ chat_id: 'c1', unread_count: 2 }]);
    const counterpartProfiles = vi.fn(async () => ({
      [OTHER]: {
        name: 'Other User',
        nameEn: 'Other User',
        avatarUrl: 'https://example.com/a.png',
        accountType: 'individual',
      },
    }));

    const result = await listChats(
      {
        chat: makeChatGateway({
          listMyChats,
          lastMessages,
          unreadCounts,
          counterpartProfiles,
        }),
      },
      { viewerId: ME },
    );

    expect(listMyChats).toHaveBeenCalledWith(undefined);
    expect(lastMessages).toHaveBeenCalledWith(['c1']);
    expect(unreadCounts).toHaveBeenCalledWith(['c1']);
    expect(counterpartProfiles).toHaveBeenCalledWith([OTHER]);
    expect(result.chats).toEqual([
      expect.objectContaining({
        chatId: 'c1',
        otherId: OTHER,
        previewText: 'Hello',
        unread: 2,
      }),
    ]);
    expect(result.profiles[OTHER]?.name).toBe('Other User');
  });

  it('skips gateway enrichment when inbox is empty', async () => {
    const lastMessages = vi.fn(async () => []);
    const unreadCounts = vi.fn(async () => []);
    const counterpartProfiles = vi.fn(async () => ({}));

    const result = await listChats(
      {
        chat: makeChatGateway({
          listMyChats: vi.fn(async () => []),
          lastMessages,
          unreadCounts,
          counterpartProfiles,
        }),
      },
      { viewerId: ME },
    );

    expect(lastMessages).not.toHaveBeenCalled();
    expect(unreadCounts).not.toHaveBeenCalled();
    expect(counterpartProfiles).not.toHaveBeenCalled();
    expect(result).toEqual({ chats: [], profiles: {} });
  });

  it('forwards the limit to listMyChats', async () => {
    const listMyChats = vi.fn(async () => []);

    await listChats(
      { chat: makeChatGateway({ listMyChats }) },
      { viewerId: ME, limit: 25 },
    );

    expect(listMyChats).toHaveBeenCalledWith(25);
  });
});
