import { describe, it, expect, vi } from 'vitest';
import type { ChatWithPreview, IChatRepository } from '@kc/application';
import { runRefreshInbox } from '../chatStoreInboxRefresh';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MinimalState {
  inboxSnapshotEpoch: number;
  inbox: unknown;
  unreadTotal: number;
}

function makeStoreApi(initialEpoch: number) {
  const state: MinimalState = {
    inboxSnapshotEpoch: initialEpoch,
    inbox: null,
    unreadTotal: 0,
  };
  const sets: Array<Partial<MinimalState>> = [];
  // The real `StoreApi` is typed against the full ChatState; runtime only
  // uses the three fields above, so a narrowed shape cast through `any` is
  // safe and keeps the test file small.
  const api = {
    getState: () => state,
    setState: (partial: Partial<MinimalState>) => {
      Object.assign(state, partial);
      sets.push(partial);
    },
  } as any;
  return { state, sets, api };
}

const CHAT: ChatWithPreview = {
  chatId: 'c_1', otherUser: { userId: 'u_1', displayName: 'A', shareHandle: 'a', avatarUrl: null, privacyMode: 'Public' },
  lastMessage: null, lastMessageAt: '2026-05-16T12:00:00.000Z', unreadCount: 0,
  ownerHiddenForViewer: false, anchorPostId: null, anchorPost: null,
} as never;

function makeRepo(opts: {
  getMyChatsImpl?: () => Promise<ChatWithPreview[]>;
  getUnreadTotalImpl?: () => Promise<number>;
} = {}): IChatRepository {
  return {
    getMyChats: opts.getMyChatsImpl ?? (() => Promise.resolve([])),
    getUnreadTotal: opts.getUnreadTotalImpl ?? (() => Promise.resolve(0)),
  } as unknown as IChatRepository;
}

describe('runRefreshInbox (FR-CHAT-012 epoch guard)', () => {
  it('fetches chats + unread total in parallel and writes them when epoch is unchanged', async () => {
    const { state, sets, api } = makeStoreApi(7);
    const repo = makeRepo({
      getMyChatsImpl: () => Promise.resolve([CHAT]),
      getUnreadTotalImpl: () => Promise.resolve(3),
    });
    await runRefreshInbox(api, 'u_me', repo);
    expect(state.inbox).toEqual([CHAT]);
    expect(state.unreadTotal).toBe(3);
    // Exactly one setState call with both fields together.
    expect(sets).toEqual([{ inbox: [CHAT], unreadTotal: 3 }]);
  });

  it('DROPS the write when inboxSnapshotEpoch advanced between fetch and write (stale snapshot)', async () => {
    const { state, sets, api } = makeStoreApi(1);
    // Simulate a local mark-read while the fetch is in flight: bump epoch before
    // the promises resolve.
    const repo = makeRepo({
      getMyChatsImpl: () =>
        new Promise<ChatWithPreview[]>((resolve) => {
          // Mid-flight: bump epoch (the real path is a synchronous mark-read in the store).
          setTimeout(() => {
            state.inboxSnapshotEpoch = 2;
            resolve([CHAT]);
          }, 0);
        }),
    });
    await runRefreshInbox(api, 'u_me', repo);
    expect(sets).toEqual([]); // setState NEVER called
    expect(state.inbox).toBeNull(); // unchanged
  });

  it('issues exactly one getMyChats and one getUnreadTotal call (in parallel)', async () => {
    const myChats = vi.fn(() => Promise.resolve([] as ChatWithPreview[]));
    const unread = vi.fn(() => Promise.resolve(0));
    const repo = makeRepo({ getMyChatsImpl: myChats, getUnreadTotalImpl: unread });
    const { api } = makeStoreApi(0);
    await runRefreshInbox(api, 'u_me', repo);
    expect(myChats).toHaveBeenCalledTimes(1);
    expect(unread).toHaveBeenCalledTimes(1);
  });

  it('propagates a repo error (no error swallowing — caller decides retry/UX)', async () => {
    const { api } = makeStoreApi(0);
    const repo = makeRepo({
      getMyChatsImpl: () => Promise.reject(new Error('rls denied')),
    });
    await expect(runRefreshInbox(api, 'u_me', repo)).rejects.toThrow('rls denied');
  });
});
