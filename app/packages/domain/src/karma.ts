// Karma value-bonus helper for the create-post slider preview. The DB (migration
// 0099) is the authoritative awarder of ALL points; the client never needs the
// per-event award amounts (the badge renders only the total; the explainer is
// qualitative i18n copy). Only the value-bonus divisor/cap are mirrored here,
// asserted against the spec in __tests__/karma.test.ts. Keep in sync with 0099.

export type KarmaEventType =
  | 'registration'
  | 'post_created'
  | 'post_removed'
  | 'outreach'
  | 'follower_gained'
  | 'follower_gained_reverse'
  | 'closure_giver'
  | 'closure_receiver'
  | 'closure_reverse'
  | 'backfill';

export const KARMA_VALUE_BONUS_DIVISOR = 50;
export const KARMA_VALUE_BONUS_CAP_VALUE = 1000;

/** Giver bonus at closure for a Give post's estimated value (FR-KARMA-003). */
export function computeValueBonus(estimatedValue: number | null | undefined): number {
  if (!estimatedValue || estimatedValue <= 0) return 0;
  const clamped = Math.min(estimatedValue, KARMA_VALUE_BONUS_CAP_VALUE);
  return Math.round(clamped / KARMA_VALUE_BONUS_DIVISOR);
}
