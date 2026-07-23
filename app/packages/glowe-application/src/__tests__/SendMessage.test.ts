import { describe, expect, it, vi } from 'vitest';

import type { GloweMessageRow, IGloweChatGateway } from '../ports/IGloweChatGateway';
import { sendMessage } from '../use-cases/SendMessage';

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

function makeMessageRow(overrides: Partial<GloweMessageRow> = {}): GloweMessageRow {
  return {
    message_id: 'm1',
    chat_id: 'c1',
    sender_id: 'u1',
    kind: 'user',
    body: 'Hello',
    created_at: '2026-07-01',
    ...overrides,
  };
}

describe('sendMessage', () => {
  it('requires a chat id and non-empty body', async () => {
    const gatewaySend = vi.fn();

    expect(
      await sendMessage(
        { chat: makeChatGateway({ sendMessage: gatewaySend }) },
        { chatId: '', body: 'Hello' },
      ),
    ).toEqual({ ok: false, error: 'Missing conversation.' });

    expect(
      await sendMessage(
        { chat: makeChatGateway({ sendMessage: gatewaySend }) },
        { chatId: 'c1', body: '   ' },
      ),
    ).toEqual({ ok: false, error: 'Please write a message.' });

    expect(gatewaySend).not.toHaveBeenCalled();
  });

  it('rejects messages longer than 2000 characters', async () => {
    const gatewaySend = vi.fn();
    const result = await sendMessage(
      { chat: makeChatGateway({ sendMessage: gatewaySend }) },
      { chatId: 'c1', body: 'x'.repeat(2001) },
    );

    expect(gatewaySend).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Messages are capped at 2000 characters.',
    });
  });

  it('sends a trimmed message through the gateway', async () => {
    const gatewaySend = vi.fn(async () => makeMessageRow({ body: 'Hello' }));
    const result = await sendMessage(
      { chat: makeChatGateway({ sendMessage: gatewaySend }) },
      { chatId: 'c1', body: '  Hello  ' },
    );

    expect(gatewaySend).toHaveBeenCalledWith('c1', 'Hello');
    expect(result).toEqual({ ok: true, message: makeMessageRow({ body: 'Hello' }) });
  });

  it('returns an error when the gateway cannot send', async () => {
    const result = await sendMessage(
      { chat: makeChatGateway({ sendMessage: vi.fn(async () => null) }) },
      { chatId: 'c1', body: 'Hello' },
    );

    expect(result).toEqual({ ok: false, error: 'Could not send message.' });
  });
});
