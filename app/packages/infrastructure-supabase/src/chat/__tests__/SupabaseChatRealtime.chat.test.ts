import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseChatRealtime } from '../SupabaseChatRealtime';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnCall {
  event: string;
  config: any;
  handler: (payload: { new: unknown }) => void;
}

interface FakeChannel {
  topic: string;
  onCalls: OnCall[];
  statusCb?: (status: string) => void;
}

function makeFakeClient(): {
  client: SupabaseClient<any>;
  channels: FakeChannel[];
  removed: FakeChannel[];
} {
  const channels: FakeChannel[] = [];
  const removed: FakeChannel[] = [];
  const builderToFc = new WeakMap<object, FakeChannel>();

  const client = {
    channel: (topic: string) => {
      const fc: FakeChannel = { topic, onCalls: [] };
      channels.push(fc);
      const builder: any = {
        on: (event: string, config: any, handler: (payload: { new: unknown }) => void) => {
          fc.onCalls.push({ event, config, handler });
          return builder;
        },
        subscribe: (statusCb: (status: string) => void) => {
          fc.statusCb = statusCb;
          return builder;
        },
      };
      builderToFc.set(builder, fc);
      return builder;
    },
    removeChannel: (ch: object) => {
      const fc = builderToFc.get(ch);
      if (fc) removed.push(fc);
      return Promise.resolve();
    },
  } as unknown as SupabaseClient<any>;

  return { client, channels, removed };
}

const MSG_ROW = {
  message_id: 'm_1',
  chat_id: 'c_1',
  sender_id: 'u_1',
  kind: 'user',
  body: 'hi',
  system_payload: null,
  status: 'delivered',
  created_at: '2026-05-16T12:00:00.000Z',
  delivered_at: '2026-05-16T12:00:01.000Z',
  read_at: null,
};

const CHAT_ROW = {
  chat_id: 'c_1',
  participant_a: 'u_1',
  participant_b: 'u_2',
  anchor_post_id: null,
  is_support_thread: false,
  last_message_at: '2026-05-16T12:00:00.000Z',
  created_at: '2026-05-16T11:00:00.000Z',
};

function sub(client: SupabaseClient<any>, extra: Record<string, any> = {}) {
  const repo = new SupabaseChatRealtime(client);
  const cb = {
    onMessage: vi.fn(),
    onMessageStatusChanged: vi.fn(),
    onError: vi.fn(),
    ...extra,
  };
  const unsub = repo.subscribeToChat('c_1', cb);
  return { repo, cb, unsub };
}

describe('SupabaseChatRealtime — subscribeToChat', () => {
  it('opens a chat:<chatId>:<rand> topic with three postgres_changes listeners', () => {
    const { client, channels } = makeFakeClient();
    sub(client);
    expect(channels[0]?.topic).toMatch(/^chat:c_1:[a-z0-9]+$/);
    expect(channels[0]?.onCalls).toHaveLength(3);
  });

  it('produces a different topic on each subscription (avoids stale-channel reuse)', () => {
    const { client, channels } = makeFakeClient();
    sub(client);
    sub(client);
    expect(channels[0]?.topic).not.toBe(channels[1]?.topic);
  });

  it('listener 1 routes INSERT on messages (filter chat_id=eq.<id>) → onMessage', () => {
    const { client, channels } = makeFakeClient();
    const { cb } = sub(client);
    const insert = channels[0]?.onCalls[0];
    expect(insert?.config).toEqual({ event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.c_1' });
    insert?.handler({ new: MSG_ROW });
    expect(cb.onMessage).toHaveBeenCalledTimes(1);
    expect(cb.onMessage.mock.calls[0]?.[0]).toMatchObject({ messageId: 'm_1', chatId: 'c_1' });
  });

  it('listener 2 routes UPDATE on messages → onMessageStatusChanged (status subset)', () => {
    const { client, channels } = makeFakeClient();
    const { cb } = sub(client);
    const update = channels[0]?.onCalls[1];
    expect(update?.config).toEqual({ event: 'UPDATE', schema: 'public', table: 'messages', filter: 'chat_id=eq.c_1' });
    update?.handler({ new: { ...MSG_ROW, status: 'read', read_at: '2026-05-16T12:00:05.000Z' } });
    expect(cb.onMessageStatusChanged).toHaveBeenCalledTimes(1);
    expect(cb.onMessageStatusChanged.mock.calls[0]?.[0]).toEqual({
      messageId: 'm_1',
      status: 'read',
      deliveredAt: '2026-05-16T12:00:01.000Z',
      readAt: '2026-05-16T12:00:05.000Z',
    });
  });

  it('listener 3 routes UPDATE on chats → onChatChanged with the mapped Chat row', () => {
    const { client, channels } = makeFakeClient();
    const onChatChanged = vi.fn();
    sub(client, { onChatChanged });
    const update = channels[0]?.onCalls[2];
    expect(update?.config).toEqual({ event: 'UPDATE', schema: 'public', table: 'chats', filter: 'chat_id=eq.c_1' });
    update?.handler({ new: CHAT_ROW });
    expect(onChatChanged).toHaveBeenCalledWith(expect.objectContaining({ chatId: 'c_1' }));
  });

  it('silently no-ops when onChatChanged is omitted (optional callback)', () => {
    const { client, channels } = makeFakeClient();
    sub(client);
    expect(() => channels[0]?.onCalls[2]?.handler({ new: CHAT_ROW })).not.toThrow();
  });

  it('routes CHANNEL_ERROR / TIMED_OUT statuses to onError with lowercased message', () => {
    const { client, channels } = makeFakeClient();
    const { cb } = sub(client);
    channels[0]?.statusCb?.('CHANNEL_ERROR');
    channels[0]?.statusCb?.('TIMED_OUT');
    expect(cb.onError.mock.calls[0]?.[0]?.message).toBe('chat channel channel_error');
    expect(cb.onError.mock.calls[1]?.[0]?.message).toBe('chat channel timed_out');
  });

  it('does not invoke onError on SUBSCRIBED', () => {
    const { client, channels } = makeFakeClient();
    const { cb } = sub(client);
    channels[0]?.statusCb?.('SUBSCRIBED');
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it('unsubscribe removes the channel via client.removeChannel', () => {
    const { client, channels, removed } = makeFakeClient();
    const { unsub } = sub(client);
    unsub();
    expect(removed[0]).toBe(channels[0]);
  });
});
