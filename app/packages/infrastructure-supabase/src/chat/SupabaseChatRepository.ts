// Supabase adapter for IChatRepository. Implements FR-CHAT-001..013 over
// migration 0004 schema, with RPCs from migration 0011 powering markRead,
// getUnreadTotal, and getOrCreateSupportThread.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IChatRepository, ChatWithPreview } from '@kc/application';
import { ChatError } from '@kc/application';
import type { Chat, Message } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';
import { mapChatError } from './mapChatError';
import { getMyChats } from './getMyChats';
import { performFindOrCreateChat } from './performFindOrCreateChat';

type Counterpart = {
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  shareHandle: string | null;
  isDeleted: boolean;
};

export class SupabaseChatRepository implements IChatRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(chatId: string): Promise<Chat | null> {
    const { data, error } = await this.client
      .from('chats')
      .select('*')
      .eq('chat_id', chatId)
      .maybeSingle();
    if (error) throw mapChatError(error);
    return data ? rowToChat(data) : null;
  }

  async findOrCreateChat(
    userId: string,
    otherUserId: string,
    anchorPostId?: string,
  ): Promise<Chat> {
    return performFindOrCreateChat(
      this.client,
      userId,
      otherUserId,
      anchorPostId,
    );
  }

  async getMessages(
    chatId: string,
    limit: number,
    beforeCreatedAt?: string,
  ): Promise<Message[]> {
    let q = this.client
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (beforeCreatedAt) q = q.lt('created_at', beforeCreatedAt);
    const { data, error } = await q;
    if (error) throw mapChatError(error);
    return (data ?? []).map(rowToMessage);
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    body: string,
  ): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        body,
        kind: 'user',
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw mapChatError(error);
    return rowToMessage(data);
  }

  async markRead(chatId: string, _userId: string): Promise<void> {
    const { error } = await this.client.rpc('rpc_chat_mark_read', {
      p_chat_id: chatId,
    });
    if (error) throw mapChatError(error);
  }

  async getUnreadTotal(_userId: string): Promise<number> {
    const { data, error } = await this.client.rpc('rpc_chat_unread_total');
    if (error) throw mapChatError(error);
    return Number(data ?? 0);
  }

  async getOrCreateSupportThread(_userId: string): Promise<Chat> {
    const { data, error } = await this.client.rpc(
      'rpc_get_or_create_support_thread',
    );
    if (error) throw mapChatError(error);
    if (!data) {
      throw new ChatError('super_admin_not_found', 'super_admin_not_found');
    }
    // RPC is declared with SetofOptions to "chats" — supabase-js may surface
    // this as either a single row or a one-element array depending on version.
    const row = (Array.isArray(data) ? data[0] : data) as
      | Database['public']['Tables']['chats']['Row']
      | undefined;
    if (!row) {
      throw new ChatError('super_admin_not_found', 'super_admin_not_found');
    }
    return rowToChat(row);
  }

  async getMyChats(userId: string): Promise<ChatWithPreview[]> {
    return getMyChats(this.client, userId);
  }

  async getCounterpart(chat: Chat, viewerId: string): Promise<Counterpart> {
    const otherId =
      chat.participantIds[0] === viewerId
        ? chat.participantIds[1]
        : chat.participantIds[0];
    // After migration 0028, otherId may be null (counterpart deleted account).
    if (otherId == null) {
      return {
        userId: null,
        displayName: 'משתמש שנמחק',
        avatarUrl: null,
        shareHandle: null,
        isDeleted: true,
      };
    }
    const { data, error } = await this.client
      .from('users')
      .select('user_id, display_name, avatar_url, share_handle')
      .eq('user_id', otherId)
      .maybeSingle();
    if (error) throw mapChatError(error);
    if (!data) {
      return {
        userId: null,
        displayName: 'משתמש שנמחק',
        avatarUrl: null,
        shareHandle: null,
        isDeleted: true,
      };
    }
    return {
      userId: data.user_id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      shareHandle: data.share_handle,
      isDeleted: false,
    };
  }
}
