// FR-MOD-010 — given a list of chat messages, return the set of message ids
// that have been "handled" by a later mod_action_taken system bubble. Used by
// the chat screen to dim the original report bubble. O(N) build, O(1) lookup.
import type { Message } from '@kc/domain';

export function computeHandledIds(messages: readonly Message[]): Set<string> {
  const s = new Set<string>();
  for (const m of messages) {
    const p = m.systemPayload as { kind?: string; handled_message_id?: string } | null;
    if (p?.kind === 'mod_action_taken' && p.handled_message_id) {
      s.add(p.handled_message_id);
    }
  }
  return s;
}
