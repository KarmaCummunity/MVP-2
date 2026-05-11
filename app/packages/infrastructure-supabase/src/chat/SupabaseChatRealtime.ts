// Supabase adapter for IChatRealtime. Wraps postgres_changes channels for
// inbox + per-chat subscriptions over the schema in migration 0004 (publication
// supabase_realtime includes chats + messages).
//
// RLS filters server-side: clients only receive events for rows they can SELECT,
// preserving the FR-CHAT-009 carve-out.
//
// Mapped to SRS: FR-CHAT-003 (≤500ms p95), FR-CHAT-011, FR-CHAT-012.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IChatRealtime,
  InboxStreamCallbacks,
  ChatStreamCallbacks,
  Unsubscribe,
} from '@kc/application';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';

const UNREAD_DEBOUNCE_MS = 200;

export class SupabaseChatRealtime implements IChatRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe {
    const channel = this.client
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => cb.onMessage(rowToMessage(payload.new as never)),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = rowToMessage(payload.new as never);
          cb.onMessageStatusChanged({
            messageId: m.messageId,
            status: m.status,
            deliveredAt: m.deliveredAt,
            readAt: m.readAt,
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (cb.onChatChanged) {
            cb.onChatChanged(rowToChat(payload.new as never));
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError(new Error(`chat channel ${status.toLowerCase()}`));
        }
      });
    return () => {
      void channel.unsubscribe();
    };
  }

  subscribeToInbox(userId: string, cb: InboxStreamCallbacks): Unsubscribe {
    let unreadTimer: ReturnType<typeof setTimeout> | null = null;
    const fireUnreadDebounced = () => {
      if (unreadTimer) clearTimeout(unreadTimer);
      unreadTimer = setTimeout(async () => {
        const { data, error } = await this.client.rpc('rpc_chat_unread_total');
        if (!error) cb.onUnreadTotalChanged(Number(data ?? 0));
      }, UNREAD_DEBOUNCE_MS);
    };

    const channel = this.client
      .channel(`inbox:${userId}`)
      // RLS filters server-side: only events on visible chats reach the client.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fireUnreadDebounced(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fireUnreadDebounced(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chats' },
        (payload) => cb.onChatChanged(rowToChat(payload.new as never)),
      )
      .subscribe();

    return () => {
      if (unreadTimer) clearTimeout(unreadTimer);
      void channel.unsubscribe();
    };
  }
}
