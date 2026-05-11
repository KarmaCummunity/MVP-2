// FR-CHAT-016 — after personal inbox hide, next open with same user creates a new thread.
const needFreshThreadWith = new Set<string>();

export function markNeedFreshThreadWith(counterpartUserId: string): void {
  needFreshThreadWith.add(counterpartUserId);
}

export function consumePreferNewThread(counterpartUserId: string): boolean {
  if (!needFreshThreadWith.has(counterpartUserId)) return false;
  needFreshThreadWith.delete(counterpartUserId);
  return true;
}
