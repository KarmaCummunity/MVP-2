// FR-CHAT-005 — apply post-entry template after `startThreadSub` hydrates the
// thread (same 50-message window as the old `contactPoster` pre-navigation fetch).
import { type Dispatch, type SetStateAction, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { firstParam, resolveDeferredPostPrefill } from '../../lib/postChatPrefillDecision';

type BuildAuto = { execute: (input: { postTitle: string }) => string };

interface Args {
  chatId: string;
  viewerId: string;
  /** When set, composer may be filled after thread messages load (unless duplicate). */
  prefillPostTitle: string | string[] | undefined;
  /** Skip when legacy `prefill` query param was used (sync init on ChatScreen). */
  legacyPrefill: string | undefined;
  setInput: Dispatch<SetStateAction<string>>;
  buildAutoMessage: BuildAuto;
}

export function useDeferredPostPrefill({
  chatId,
  viewerId,
  prefillPostTitle,
  legacyPrefill,
  setInput,
  buildAutoMessage,
}: Args): void {
  const title = firstParam(prefillPostTitle);
  const enabled = Boolean(title) && !legacyPrefill;
  const threadHydrated = useChatStore((s) => Object.hasOwn(s.threads, chatId));
  const messages = useChatStore((s) => s.threads[chatId]);

  const doneRef = useRef(false);

  useEffect(() => {
    if (!enabled || doneRef.current) return;
    if (!threadHydrated || messages === undefined) return;
    if (!title) return;

    doneRef.current = true;
    const next = resolveDeferredPostPrefill({
      viewerId,
      messages,
      postTitle: title,
      buildTemplate: (t) => buildAutoMessage.execute({ postTitle: t }),
    });
    if (!next) return;
    setInput((prev) => (prev === '' ? next : prev));
  }, [buildAutoMessage, chatId, enabled, messages, setInput, threadHydrated, title, viewerId]);
}
