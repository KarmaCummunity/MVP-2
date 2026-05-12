// Inbox load + Realtime wiring extracted from chatStore.ts (architecture LOC cap, TD-118).
import type { IChatRepository, IChatRealtime } from '@kc/application';
import type { ChatState } from './chatStoreTypes';
import { runRefreshInbox } from './chatStoreInboxRefresh';

type StoreApi = {
  getState: () => ChatState;
  setState: (partial: Partial<ChatState>) => void;
};

export async function runStartInboxSub(
  api: StoreApi,
  noopUnsub: () => void,
  userId: string,
  repo: IChatRepository,
  realtime: IChatRealtime,
): Promise<void> {
  await runRefreshInbox(api, userId, repo);

  if (api.getState().inboxSub !== noopUnsub) {
    return;
  }

  const unsub = realtime.subscribeToInbox(
    userId,
    {
      onChatChanged: (chat) => {
        api.getState().upsertChatPreview(chat);
      },
      onUnreadTotalChanged: (total) => {
        api.setState({ unreadTotal: total });
      },
      onInboxMessageInsert: (message) => {
        api.getState().bumpInboxForIncomingInsert(userId, message);
      },
    },
    { getSnapshotEpoch: () => api.getState().inboxSnapshotEpoch },
  );

  if (api.getState().inboxSub !== noopUnsub) {
    unsub();
    return;
  }

  api.setState({ inboxSub: unsub });
}

export { runRefreshInbox } from './chatStoreInboxRefresh';
