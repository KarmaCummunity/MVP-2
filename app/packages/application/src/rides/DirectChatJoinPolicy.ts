import type { IRideJoinPolicy } from './ports/IRideJoinPolicy';

/** FR-RIDE-010 — V2.0 always opens direct chat. */
export class DirectChatJoinPolicy implements IRideJoinPolicy {
  allowsDirectChat(): boolean {
    return true;
  }
}
