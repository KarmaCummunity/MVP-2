// FR-CHAT-001..013, FR-CHAT-016 — Zustand store owning chat state + realtime subscription lifecycle.
import { create } from 'zustand';
import type { Message } from '@kc/domain';
import type { IChatRepository, IChatRealtime } from '@kc/application';
import type { ChatState, OptimisticMessage } from './chatStoreTypes';

export type { OptimisticMessage } from './chatStoreTypes';

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
    next.sort((a, b) => {
      const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      return tb - ta;
    });
    set({ inbox: next });
  },

  setUnreadTotal: (n) => set({ unreadTotal: n }),

  markChatLocallyRead: (chatId) =>
    set((s) => {
      const inbox = s.inbox;
      if (!inbox) return s;
      const row = inbox.find((c) => c.chatId === chatId);
      if (!row || row.unreadCount === 0) return s;
      const nextTotal = Math.max(0, s.unreadTotal - row.unreadCount);
      const nextInbox = inbox.map((c) =>
        c.chatId === chatId ? { ...c, unreadCount: 0 } : c,
      );
      return { inbox: nextInbox, unreadTotal: nextTotal };
    }),

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
      const optimisticIdx = list.findIndex(
        (m) => m.status === 'pending' && m.senderId === msg.senderId && m.body === msg.body,
      );
      if (optimisticIdx >= 0) {
        const next = list.map((m, i) =>
          i === optimisticIdx ? { ...msg, clientId: m.clientId, failed: false } : m,
        );
        return { threads: { ...s.threads, [chatId]: next } };
      }
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
    const noopUnsub = () => {};
    set({ inboxSub: noopUnsub });
    try {
      const [chats, unread] = await Promise.all([
        repo.getMyChats(userId),
        repo.getUnreadTotal(userId),
      ]);
      if (get().inboxSub !== noopUnsub) return;
      set({ inbox: chats, unreadTotal: unread });
      const unsub = realtime.subscribeToInbox(userId, {
        onChatChanged: (chat) => get().upsertChatPreview(chat),
        onUnreadTotalChanged: (total) => set({ unreadTotal: total }),
      });
      set({ inboxSub: unsub });
    } catch (err) {
      if (get().inboxSub === noopUnsub) set({ inboxSub: null });
      throw err;
    }
  },

  startThreadSub: async (chatId, repo, realtime, onChatChanged) => {
    if (get().threadSubs[chatId]) return;
    const noopUnsub = () => {};
    set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: noopUnsub } }));
    try {
      const msgs = await repo.getMessages(chatId, 50);
      if (get().threadSubs[chatId] !== noopUnsub) return;
      get().setThreadMessages(chatId, msgs);
      const unsub = realtime.subscribeToChat(chatId, {
        onMessage: (m) => get().applyIncomingMessage(chatId, m),
        onMessageStatusChanged: (p) => get().applyStatusChange(chatId, p),
        onChatChanged,
        onError: () => { /* deferred: surface via ChatChannelStatus hook */ },
      });
      set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: unsub } }));
    } catch (err) {
      set((s) => {
        if (s.threadSubs[chatId] !== noopUnsub) return s;
        const { [chatId]: _, ...rest } = s.threadSubs;
        return { threadSubs: rest };
      });
      throw err;
    }
  },

  stopThreadSub: (chatId) =>
    set((s) => {
      const unsub = s.threadSubs[chatId];
      if (unsub) unsub();
      const { [chatId]: _removed, ...rest } = s.threadSubs;
      return { threadSubs: rest };
    }),

  refreshInbox: async (userId, repo) => {
    const [chats, unread] = await Promise.all([
      repo.getMyChats(userId),
      repo.getUnreadTotal(userId),
    ]);
    set({ inbox: chats, unreadTotal: unread });
  },

  resetOnSignOut: () => {
    const s = get();
    if (s.inboxSub) s.inboxSub();
    Object.values(s.threadSubs).forEach((u) => u());
    set({ inbox: null, unreadTotal: 0, threads: {}, inboxSub: null, threadSubs: {} });
  },
}));
