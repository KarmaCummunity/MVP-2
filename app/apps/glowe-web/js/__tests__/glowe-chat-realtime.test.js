import { describe, it, expect, vi } from 'vitest';
import GloweChatRealtime from '../glowe-chat-realtime.js';

function mockClient() {
  const handlers = [];
  const channel = {
    on: vi.fn(function (_event, _filter, cb) {
      handlers.push(cb);
      return channel;
    }),
    subscribe: vi.fn(function (statusCb) {
      if (statusCb) statusCb('SUBSCRIBED');
      return channel;
    })
  };
  return {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    rpc: vi.fn(async () => ({ data: 3, error: null })),
    _handlers: handlers,
    _channel: channel
  };
}

describe('subscribeToChat', () => {
  it('registers INSERT on messages and returns unsubscribe', () => {
    const client = mockClient();
    const onMessage = vi.fn();
    const unsub = GloweChatRealtime.subscribeToChat(client, 'chat-1', { onMessage });
    expect(client.channel).toHaveBeenCalled();
    expect(client._channel.on).toHaveBeenCalled();
    unsub();
    expect(client.removeChannel).toHaveBeenCalled();
  });
});
