import type { User } from '@kc/domain';
// Reuse the existing Unsubscribe type — do NOT redeclare it. IChatRealtime
// already exports `Unsubscribe`; a second declaration re-exported through the
// barrel is a TS2308 "already exported a member named 'Unsubscribe'" error.
import type { Unsubscribe } from './IChatRealtime';

/**
 * Subscribe to the signed-in user's own `users` row (FR-KARMA-009).
 * RLS guarantees a client only ever receives its own row. Used to push
 * karma_points + all per-user counters live (closes FR-STATS-001 AC2 / TD-98).
 * `onError` fires on a dropped/timed-out channel so the consumer can resubscribe
 * (a silent dead socket would otherwise freeze counters with no recovery signal).
 */
export interface IUserRealtime {
  subscribeToSelf(
    userId: string,
    onChange: (user: User) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe;
}
