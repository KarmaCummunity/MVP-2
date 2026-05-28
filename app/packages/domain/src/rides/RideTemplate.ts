// FR-RIDE-021 — recurring ride template entity.
import type { RideMode } from './RideMode';

export type RideTemplateStatus = 'active' | 'paused' | 'archived';

export interface RideTemplate {
  readonly templateId: string;
  readonly ownerId: string;
  readonly mode: RideMode;
  readonly originCityId: string;
  readonly destCityId: string;
  readonly originStreet: string;
  readonly originStreetNumber: string | null;
  readonly destStreet: string;
  readonly destStreetNumber: string | null;
  /** Local time of day in 'HH:MM' (or 'HH:MM:SS') form. */
  readonly departTime: string;
  /** Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64. */
  readonly weekdayMask: number;
  readonly seatsAvailable: number | null;
  readonly description: string | null;
  readonly visibility: 'Public' | 'FollowersOnly' | 'OnlyMe';
  readonly status: RideTemplateStatus;
  /** Days into the future the materializer should cover for this template. */
  readonly lookaheadDays: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
