import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseFeedRealtime } from '../SupabaseFeedRealtime';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnCall {
  event: string;
  config: any;
  handler: (payload: unknown) => void;
}

interface FakeChannel {
  topic: string;
  onCalls: OnCall[];
  statusCb?: (status: string) => void;
}

interface FakeClient {
  client: SupabaseClient<any>;
  channels: FakeChannel[];
  removed: FakeChannel[];
}

function makeFakeClient(): FakeClient {
  const channels: FakeChannel[] = [];
  const removed: FakeChannel[] = [];
  // Source code holds onto the builder (return of .subscribe()) and passes
  // it to client.removeChannel(). Map builder → FakeChannel so the test
  // can assert "the right channel was removed".
  const builderToFc = new WeakMap<object, FakeChannel>();

  const client = {
    channel: (topic: string) => {
      const fc: FakeChannel = { topic, onCalls: [] };
      channels.push(fc);
      const builder: any = {
        on: (event: string, config: any, handler: (payload: unknown) => void) => {
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

describe('SupabaseFeedRealtime — subscribeToPublicInserts', () => {
  describe('channel + on-call configuration', () => {
    it('creates a channel with a unique posts:public-feed topic', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });

      expect(channels).toHaveLength(1);
      expect(channels[0]?.topic).toMatch(/^posts:public-feed:[a-z0-9]+$/);
    });

    it('produces a different topic for each subscription (avoids stale-channel cache reuse)', () => {
      // Two subscriptions in a row must NOT share a topic — the realtime
      // client caches channels by topic, and reusing one throws
      // "cannot add postgres_changes callbacks after subscribe()".
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });
      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });

      expect(channels[0]?.topic).not.toBe(channels[1]?.topic);
    });

    it('registers exactly one postgres_changes listener with the INSERT/public/posts/visibility=eq.Public filter', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });

      const ch = channels[0]!;
      expect(ch.onCalls).toHaveLength(1);
      expect(ch.onCalls[0]?.event).toBe('postgres_changes');
      expect(ch.onCalls[0]?.config).toEqual({
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'visibility=eq.Public',
      });
    });
  });

  describe('payload handler', () => {
    it('invokes onNewPublicPost when the postgres_changes handler fires', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);
      const onNewPublicPost = vi.fn();

      repo.subscribeToPublicInserts({ onNewPublicPost });
      channels[0]!.onCalls[0]!.handler({});

      expect(onNewPublicPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe status callback', () => {
    it('invokes onError with a "channel_error" Error when status is CHANNEL_ERROR', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);
      const onError = vi.fn();

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn(), onError });
      channels[0]!.statusCb!('CHANNEL_ERROR');

      expect(onError).toHaveBeenCalledTimes(1);
      const err = onError.mock.calls[0]![0];
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe('feed channel channel_error');
    });

    it('invokes onError with a "timed_out" Error when status is TIMED_OUT', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);
      const onError = vi.fn();

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn(), onError });
      channels[0]!.statusCb!('TIMED_OUT');

      expect((onError.mock.calls[0]![0] as Error).message).toBe('feed channel timed_out');
    });

    it('does not invoke onError on a successful SUBSCRIBED status', () => {
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);
      const onError = vi.fn();

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn(), onError });
      channels[0]!.statusCb!('SUBSCRIBED');

      expect(onError).not.toHaveBeenCalled();
    });

    it('silently no-ops on error statuses when onError callback is not provided', () => {
      // onError is optional on the callbacks interface — the subscriber
      // must guard the call so an unhandled status doesn't throw.
      const { client, channels } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });

      expect(() => channels[0]!.statusCb!('CHANNEL_ERROR')).not.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('returns a function that removes the channel via client.removeChannel', () => {
      const { client, channels, removed } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      const unsubscribe = repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });
      unsubscribe();

      expect(removed).toHaveLength(1);
      expect(removed[0]).toBe(channels[0]);
    });

    it('does not pre-remove the channel — only removes when unsubscribe is invoked', () => {
      const { client, removed } = makeFakeClient();
      const repo = new SupabaseFeedRealtime(client);

      repo.subscribeToPublicInserts({ onNewPublicPost: vi.fn() });

      expect(removed).toHaveLength(0);
    });
  });
});
