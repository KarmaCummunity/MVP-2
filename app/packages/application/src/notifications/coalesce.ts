/**
 * Coalescing helpers for the notification dispatcher.
 *
 * IMPORTANT: This file is byte-mirrored at supabase/functions/dispatch-notification/coalesce.ts.
 * CI fails the build if they drift. See scripts/check-architecture.mjs.
 */

export interface CoalesceResult {
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly bodyArgs: Readonly<Record<string, string | number>>;
}

export function coalesceChat(input: {
  priorCount: number;
  senderName: string;
  messagePreview: string;
}): CoalesceResult {
  if (input.priorCount === 0) {
    return {
      titleKey: 'notifications.chatTitle',
      bodyKey: 'notifications.chatBody',
      bodyArgs: { senderName: input.senderName, messagePreview: input.messagePreview },
    };
  }
  return {
    titleKey: 'notifications.chatTitle',
    bodyKey: 'notifications.chatBodyCoalesced',
    bodyArgs: { senderName: input.senderName, count: input.priorCount + 1 },
  };
}

export function coalesceFollowStarted(input: {
  priorCount: number;
  followerName: string;
}): CoalesceResult {
  const count = input.priorCount + 1;
  if (count < 3) {
    return {
      titleKey: 'notifications.followStartedTitle',
      bodyKey: 'notifications.followStartedBody',
      bodyArgs: { followerName: input.followerName },
    };
  }
  return {
    titleKey: 'notifications.followStartedTitle',
    bodyKey: 'notifications.followStartedCoalesced',
    bodyArgs: { count },
  };
}
