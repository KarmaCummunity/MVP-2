// FR-GLOWE-016 AC6 — KC shared chat tables (backend.js kc* chat block).

export interface GloweChatRow {
  readonly chat_id: string;
  readonly participant_a: string;
  readonly participant_b: string;
  readonly last_message_at: string | null;
  readonly is_support_thread?: boolean;
  readonly inbox_hidden_at_a?: string | null;
  readonly inbox_hidden_at_b?: string | null;
}

export interface GloweMessageRow {
  readonly message_id: string;
  readonly chat_id: string;
  readonly sender_id: string;
  readonly kind: string;
  readonly body: string;
  readonly created_at: string;
  readonly status?: string;
}

export interface GloweChatUnreadCount {
  readonly chat_id: string;
  readonly unread_count: number;
}

export interface GloweCounterpartProfile {
  readonly name: string;
  readonly nameEn: string;
  readonly avatarUrl: string;
  readonly accountType: string | null;
}

export type GloweCounterpartProfileMap = Readonly<
  Record<string, GloweCounterpartProfile>
>;

export interface IGloweChatGateway {
  getOrCreateDmChat(otherUserId: string): Promise<GloweChatRow | null>;
  listMyChats(limit?: number): Promise<readonly GloweChatRow[]>;
  lastMessages(chatIds: readonly string[]): Promise<readonly GloweMessageRow[]>;
  unreadCounts(chatIds: readonly string[]): Promise<readonly GloweChatUnreadCount[]>;
  unreadTotal(): Promise<number>;
  getMessages(chatId: string, limit?: number): Promise<readonly GloweMessageRow[]>;
  sendMessage(chatId: string, body: string): Promise<GloweMessageRow | null>;
  markChatRead(chatId: string): Promise<boolean | null>;
  counterpartProfiles(userIds: readonly string[]): Promise<GloweCounterpartProfileMap>;
}
