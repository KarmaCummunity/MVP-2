// FR-CHAT-001..013 — Zustand store owning chat state + realtime subscription lifecycle.
import { create } from 'zustand';
import type { Chat, Message, MessageStatus } from '@kc/domain';
import type {
  ChatWithPreview,
  IChatRepository,
  IChatRealtime,
  Unsubscribe,
} from '@kc/application';

export interface OptimisticMessage extends Message {
  clientId: string; // present until server-ack
  failed?: boolean;
}

interface ChatState {
  inbox: ChatWithPreview[] | null;
  unreadTotal: number;
  threads: Record<string, OptimisticMessage[]>; // asc by createdAt
  inboxSub: Unsubscribe | null;
  threadSubs: Record<string, Unsubscribe>;

  setInbox(chats: ChatWithPreview[]): void;
  upsertChatPreview(chat: Chat): void;
  setUnreadTotal(n: number): void;

  setThreadMessages(chatId: string, msgs: Message[]): void;
  appendOptimistic(chatId: string, msg: OptimisticMessage): void;
  reconcileSent(chatId: string, clientId: string, server: Message): void;
  markFailed(chatId: string, clientId: string): void;
  applyIncomingMessage(chatId: string, msg: Message): void;
  applyStatusChange(
    chatId: string,
    patch: {
      messageId: string;
      status: MessageStatus;
      deliveredAt: string | null;
      readAt: string | null;
    },
  ): void;

  startInboxSub(userId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
  startThreadSub(chatId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
  stopThreadSub(chatId: string): void;
  resetOnSignOut(): void;
}

const compareCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt);

const toOptimistic = (m: Message): OptimisticMessage => ({ ...m, clientId: m.messageId });

export const useChatStore = create<ChatState>((set, get) => ({
  inbox: null,
  unreadTotal: 0,
  threads: {},
  inboxSub: null,
  threadSubs: {},

  setInbox: (chats) => set({ inbox: chats }),

  upsertChatPreview: (chat) => {
    const inbox = get().inbox ?? [];
    const idx = inbox.findIndex((c) => c.chatId === chat.chatId);
    const next =
      idx >= 0 ? inbox.map((c, i) => (i === idx ? { ...c, ...chat } : c)) : inbox;
    // new chats discovered via realtime are filled when getMyChats refreshes
    next.sort((a, b) => {
      const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      return tb - ta;
    });
    set({ inbox: next });
  },

  setUnreadTotal: (n) => set({ unreadTotal: n }),

  setThreadMessages: (chatId, msgs) => {
    const next = msgs.map(toOptimistic).sort(compareCreatedAt);
    set((s) => ({ threads: { ...s.threads, [chatId]: next } }));
  },

  appendOptimistic: (chatId, msg) =>
    set((s) => ({
      threads: { ...s.threads, [chatId]: [...(s.threads[chatId] ?? []), msg] },
    })),

  reconcileSent: (chatId, clientId, server) =>
    set((s) => {
      const list = s.threads[chatId] ?? [];
      const next = list.map((m) =>
        m.clientId === clientId ? { ...server, clientId, failed: false } : m,
      );
      return { threads: { ...s.threads, [chatId]: next } };
    }),

  markFailed: (chatId, clientId) =>
    set((s) => ({
      threads: {
        ...s.threads,
        [chatId]: (s.threads[chatId] ?? []).map((m) =>
          m.clientId === clientId ? { ...m, failed: true } : m,
        ),
      },
    })),

  applyIncomingMessage: (chatId, msg) =>
    set((s) => {
      const list = s.threads[chatId] ?? [];
      if (list.some((m) => m.messageId === msg.messageId)) return s;
      const next = [...list, toOptimistic(msg)].sort(compareCreatedAt);
      return { threads: { ...s.threads, [chatId]: next } };
    }),

  applyStatusChange: (chatId, patch) =>
    set((s) => ({
      threads: {
        ...s.threads,
        [chatId]: (s.threads[chatId] ?? []).map((m) =>
          m.messageId === patch.messageId
            ? {
                ...m,
                status: patch.status,
                deliveredAt: patch.deliveredAt,
                readAt: patch.readAt,
              }
            : m,
        ),
      },
    })),

  startInboxSub: async (userId, repo, realtime) => {
    if (get().inboxSub) return;
    const [chats, unread] = await Promise.all([
      repo.getMyChats(userId),
      repo.getUnreadTotal(userId),
    ]);
    set({ inbox: chats, unreadTotal: unread });
    const unsub = realtime.subscribeToInbox(userId, {
      onChatChanged: (chat) => get().upsertChatPreview(chat),
      onUnreadTotalChanged: (total) => set({ unreadTotal: total }),
    });
    set({ inboxSub: unsub });
  },

  startThreadSub: async (chatId, repo, realtime) => {
    if (get().threadSubs[chatId]) return;
    const msgs = await repo.getMessages(chatId, 50);
    get().setThreadMessages(chatId, msgs);
    const unsub = realtime.subscribeToChat(chatId, {
      onMessage: (m) => get().applyIncomingMessage(chatId, m),
      onMessageStatusChanged: (p) => get().applyStatusChange(chatId, p),
      onError: () => {
        /* deferred: surface to screen via ChatChannelStatus hook later */
      },
    });
    set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: unsub } }));
  },

  stopThreadSub: (chatId) =>
    set((s) => {
      const unsub = s.threadSubs[chatId];
      if (unsub) unsub();
      const { [chatId]: _removed, ...rest } = s.threadSubs;
      return { threadSubs: rest };
    }),

  resetOnSignOut: () => {
    const s = get();
    if (s.inboxSub) s.inboxSub();
    Object.values(s.threadSubs).forEach((u) => u());
    set({ inbox: null, unreadTotal: 0, threads: {}, inboxSub: null, threadSubs: {} });
  },
}));
