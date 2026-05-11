// Loads chat metadata + counterpart, kicks off the message subscription, and
// clears unread on entry. Extracted from chat/[id].tsx to keep that screen
// under the architecture LOC cap (TD-118 target: drop allowlist entry).
//
// Three independent network paths fan out in parallel — strict-serial awaits
// here used to compound into a visible first-paint delay on web.
//   1. chat row → counterpart (counterpart depends on chat.participantIds)
//   2. messages (via startThreadSub) — populates the bubble list
//   3. mark-read RPC + local badge clear
import { useEffect, useState } from 'react';
import type { Chat } from '@kc/domain';
import { useChatStore } from '../store/chatStore';
import { container } from '../lib/container';

export interface ChatCounterpart {
  displayName: string;
  shareHandle: string | null;
  isDeleted: boolean;
}

const EMPTY_COUNTERPART: ChatCounterpart = { displayName: '', shareHandle: null, isDeleted: false };

export function useChatInit(chatId: string, userId: string) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [counterpart, setCounterpart] = useState<ChatCounterpart>(EMPTY_COUNTERPART);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const c = await container.chatRepo.findById(chatId);
      if (cancelled || !c) return;
      const cp = await container.chatRepo.getCounterpart(c, userId);
      if (cancelled) return;
      setChat(c);
      setCounterpart({
        displayName: cp.displayName,
        shareHandle: cp.shareHandle,
        isDeleted: cp.isDeleted,
      });
    })();

    void useChatStore
      .getState()
      .startThreadSub(chatId, container.chatRepo, container.chatRealtime, (next) => {
        // Chat row changed in realtime (e.g. anchor_post_id flipped because the
        // counterpart entered from a new post, or the post anchored here just
        // closed — see migration 0026). Refresh local state so AnchoredPostCard
        // reflects the new anchor without requiring a screen reload.
        if (!cancelled) setChat(next);
      });

    void (async () => {
      try {
        await container.markChatRead.execute({ chatId, userId });
        if (!cancelled) useChatStore.getState().markChatLocallyRead(chatId);
      } catch {
        /* read-state lag is recoverable; realtime will reconcile */
      }
    })();

    return () => {
      cancelled = true;
      useChatStore.getState().stopThreadSub(chatId);
    };
  }, [chatId, userId]);

  return { chat, counterpart };
}
