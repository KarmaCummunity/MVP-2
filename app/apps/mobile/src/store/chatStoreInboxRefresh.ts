// Full inbox snapshot fetch with FR-CHAT-012 epoch guard (stale load vs mark-read).
import type { IChatRepository } from '@kc/application';
import type { ChatState } from './chatStoreTypes';

type StoreApi = {
  getState: () => ChatState;
  setState: (partial: Partial<ChatState>) => void;
};

export async function runRefreshInbox(
  api: StoreApi,
  userId: string,
  repo: IChatRepository,
): Promise<void> {
  const epoch0 = api.getState().inboxSnapshotEpoch;
  const [chats, total] = await Promise.all([
    repo.getMyChats(userId),
    repo.getUnreadTotal(userId),
  ]);
  if (api.getState().inboxSnapshotEpoch !== epoch0) return;
  api.setState({ inbox: chats, unreadTotal: total });
}
