import { describe, it, expect, vi } from 'vitest';
import type { Chat, Message } from '@kc/domain';
import type {
  ChatWithPreview,
  IChatRealtime,
  IChatRepository,
} from '@kc/application';
import { runStartInboxSub } from '../chatStoreInboxLifecycle';

/* eslint-disable @typescript-eslint/no-explicit-any */

// runStartInboxSub coordinates a 4-step dance:
//   1. runRefreshInbox (fetch snapshot)
//   2. abort if inboxSub already swapped to a real subscription mid-flight
//   3. realtime.subscribeToInbox returns an unsub
//   4. abort the new sub if state.inboxSub changed during subscribe()

const CHAT: ChatWithPreview = {
  chatId: 'c_1', otherUser: { userId: 'u_1', displayName: 'A', shareHandle: 'a', avatarUrl: null, privacyMode: 'Public' },
  lastMessage: null, lastMessageAt: '2026-05-16T12:00:00.000Z', unreadCount: 0,
  ownerHiddenForViewer: false, anchorPostId: null, anchorPost: null,
} as never;

interface State {
  inboxSnapshotEpoch: number;
  inbox: unknown;
  unreadTotal: number;
  inboxSub: (() => void) | null;
  upsertChatPreview: (chat: Chat) => void;
  bumpInboxForIncomingInsert: (userId: string, msg: Message) => void;
}

function makeStoreApi(seed: Partial<State>) {
  const upsertSpy = vi.fn();
  const bumpSpy = vi.fn();
  const state: State = {
    inboxSnapshotEpoch: 0,
    inbox: null,
    unreadTotal: 0,
    inboxSub: null,
    upsertChatPreview: upsertSpy,
    bumpInboxForIncomingInsert: bumpSpy,
    ...seed,
  };
  return {
    state,
    upsertSpy,
    bumpSpy,
    api: {
      getState: () => state,
      setState: (partial: Partial<State>) => Object.assign(state, partial),
    } as any,
  };
}

function makeRepo(): IChatRepository {
  return {
    getMyChats: () => Promise.resolve([CHAT]),
    getUnreadTotal: () => Promise.resolve(2),
  } as unknown as IChatRepository;
}

function makeRealtime(opts: {
  unsub?: () => void;
  capture?: (handlers: any) => void;
} = {}): IChatRealtime {
  return {
    subscribeToInbox: (_userId: string, handlers: any) => {
      opts.capture?.(handlers);
      return opts.unsub ?? (() => undefined);
    },
  } as unknown as IChatRealtime;
}

describe('runStartInboxSub', () => {
  it('fetches the snapshot, then subscribes and stores the unsub in inboxSub', async () => {
    const noopUnsub = vi.fn();
    const realUnsub = vi.fn();
    const { state, api } = makeStoreApi({ inboxSub: noopUnsub });
    const realtime = makeRealtime({ unsub: realUnsub });

    await runStartInboxSub(api, noopUnsub, 'u_me', makeRepo(), realtime);

    expect(state.inbox).toEqual([CHAT]);
    expect(state.unreadTotal).toBe(2);
    expect(state.inboxSub).toBe(realUnsub);
    expect(noopUnsub).not.toHaveBeenCalled();
    expect(realUnsub).not.toHaveBeenCalled();
  });

  it('bails early WITHOUT subscribing when inboxSub no longer matches noopUnsub after refresh (concurrent start)', async () => {
    const noopUnsub = vi.fn();
    const competingUnsub = vi.fn();
    const subscribeSpy = vi.fn();
    const { state, api } = makeStoreApi({ inboxSub: noopUnsub });
    const realtime: IChatRealtime = {
      subscribeToInbox: ((..._args: unknown[]) => {
        subscribeSpy();
        return () => undefined;
      }) as never,
    } as unknown as IChatRealtime;

    // Repo getMyChats fires synchronously; we swap inboxSub before the
    // post-refresh check runs.
    const repo: IChatRepository = {
      getMyChats: () => {
        state.inboxSub = competingUnsub;
        return Promise.resolve([CHAT]);
      },
      getUnreadTotal: () => Promise.resolve(2),
    } as unknown as IChatRepository;

    await runStartInboxSub(api, noopUnsub, 'u_me', repo, realtime);

    expect(subscribeSpy).not.toHaveBeenCalled();
    expect(state.inboxSub).toBe(competingUnsub); // unchanged
  });

  it('unsubscribes the new sub and bails when inboxSub changed during subscribe() (mid-subscribe race)', async () => {
    const noopUnsub = vi.fn();
    const competingUnsub = vi.fn();
    const newSubUnsub = vi.fn();
    const { state, api } = makeStoreApi({ inboxSub: noopUnsub });

    const realtime: IChatRealtime = {
      subscribeToInbox: ((..._args: unknown[]) => {
        // Mid-subscribe race: someone else swaps inboxSub before we get the
        // chance to write our new unsub.
        state.inboxSub = competingUnsub;
        return newSubUnsub;
      }) as never,
    } as unknown as IChatRealtime;

    await runStartInboxSub(api, noopUnsub, 'u_me', makeRepo(), realtime);

    expect(newSubUnsub).toHaveBeenCalledTimes(1); // new sub torn down
    expect(state.inboxSub).toBe(competingUnsub); // unchanged
  });

  it('wires onChatChanged → state.upsertChatPreview (subscription handler dispatch)', async () => {
    const noopUnsub = vi.fn();
    let handlers: any = null;
    const { state, upsertSpy, api } = makeStoreApi({ inboxSub: noopUnsub });
    const realtime = makeRealtime({ capture: (h) => { handlers = h; } });

    await runStartInboxSub(api, noopUnsub, 'u_me', makeRepo(), realtime);
    const chat: Chat = { chatId: 'c_2' } as never;
    handlers.onChatChanged(chat);

    expect(upsertSpy).toHaveBeenCalledWith(chat);
    void state;
  });

  it('wires onUnreadTotalChanged → setState({ unreadTotal })', async () => {
    const noopUnsub = vi.fn();
    let handlers: any = null;
    const { state, api } = makeStoreApi({ inboxSub: noopUnsub });
    const realtime = makeRealtime({ capture: (h) => { handlers = h; } });

    await runStartInboxSub(api, noopUnsub, 'u_me', makeRepo(), realtime);
    handlers.onUnreadTotalChanged(42);

    expect(state.unreadTotal).toBe(42);
  });

  it('wires onInboxMessageInsert → state.bumpInboxForIncomingInsert(userId, msg)', async () => {
    const noopUnsub = vi.fn();
    let handlers: any = null;
    const { bumpSpy, api } = makeStoreApi({ inboxSub: noopUnsub });
    const realtime = makeRealtime({ capture: (h) => { handlers = h; } });

    await runStartInboxSub(api, noopUnsub, 'u_me', makeRepo(), realtime);
    const msg: Message = { messageId: 'm_1', chatId: 'c_1' } as never;
    handlers.onInboxMessageInsert(msg);

    expect(bumpSpy).toHaveBeenCalledWith('u_me', msg);
  });
});
