import { describe, expect, it, vi } from 'vitest';

import type { GloweChatRow, IGloweChatGateway } from '../ports/IGloweChatGateway';
import { getOrCreateChat } from '../use-cases/GetOrCreateChat';

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

function makeChatRow(overrides: Partial<GloweChatRow> = {}): GloweChatRow {
  return {
    chat_id: 'c1',
    participant_a: ME,
    participant_b: OTHER,
    last_message_at: null,
    ...overrides,
  };
}

describe('getOrCreateChat', () => {
  it('requires viewer and other user ids', async () => {
    const getOrCreateDmChat = vi.fn();

    expect(
      await getOrCreateChat(
        { chat: makeChatGateway({ getOrCreateDmChat }) },
        { viewerId: '', otherUserId: OTHER },
      ),
    ).toEqual({ ok: false, error: 'Missing member to message.' });

    expect(
      await getOrCreateChat(
        { chat: makeChatGateway({ getOrCreateDmChat }) },
        { viewerId: ME, otherUserId: '' },
      ),
    ).toEqual({ ok: false, error: 'Missing member to message.' });

    expect(getOrCreateDmChat).not.toHaveBeenCalled();
  });

  it('rejects self-chat', async () => {
    const getOrCreateDmChat = vi.fn();
    const result = await getOrCreateChat(
      { chat: makeChatGateway({ getOrCreateDmChat }) },
      { viewerId: ME, otherUserId: ME },
    );

    expect(getOrCreateDmChat).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'You cannot message yourself.' });
  });

  it('creates a chat and returns its id', async () => {
    const getOrCreateDmChat = vi.fn(async () => makeChatRow());
    const result = await getOrCreateChat(
      { chat: makeChatGateway({ getOrCreateDmChat }) },
      { viewerId: ME, otherUserId: OTHER },
    );

    expect(getOrCreateDmChat).toHaveBeenCalledWith(OTHER);
    expect(result).toEqual({ ok: true, chatId: 'c1' });
  });

  it('returns an error when the gateway cannot create the chat', async () => {
    const result = await getOrCreateChat(
      { chat: makeChatGateway({ getOrCreateDmChat: vi.fn(async () => null) }) },
      { viewerId: ME, otherUserId: OTHER },
    );

    expect(result).toEqual({ ok: false, error: 'Could not open conversation.' });
  });

  it('seeds the first message when provided', async () => {
    const sendMessage = vi.fn(async () => ({
      message_id: 'm1',
      chat_id: 'c1',
      sender_id: ME,
      kind: 'user',
      body: 'Hello',
      created_at: '2026-07-01',
    }));
    const result = await getOrCreateChat(
      {
        chat: makeChatGateway({
          getOrCreateDmChat: vi.fn(async () => makeChatRow()),
          sendMessage,
        }),
      },
      { viewerId: ME, otherUserId: OTHER, seedBody: 'Hello' },
    );

    expect(sendMessage).toHaveBeenCalledWith('c1', 'Hello');
    expect(result).toEqual({ ok: true, chatId: 'c1' });
  });

  it('still returns the chat id when seeding fails', async () => {
    const sendMessage = vi.fn(async () => null);
    const result = await getOrCreateChat(
      {
        chat: makeChatGateway({
          getOrCreateDmChat: vi.fn(async () => makeChatRow()),
          sendMessage,
        }),
      },
      { viewerId: ME, otherUserId: OTHER, seedBody: 'Hello' },
    );

    expect(sendMessage).toHaveBeenCalledWith('c1', 'Hello');
    expect(result).toEqual({ ok: true, chatId: 'c1' });
  });
});
