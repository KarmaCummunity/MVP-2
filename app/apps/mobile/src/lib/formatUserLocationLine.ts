import type { User } from '@kc/domain';

/**
 * Profile location line: **city only**. Saved street/number (`FR-PROFILE-007`) is not shown on
 * profile headers — it backs post default pickup location and feed proximity, not public display.
 */
export function formatUserLocationLine(u: Pick<User, 'cityName'>): string | null {
  const city = u.cityName?.trim() ?? '';
  return city.length > 0 ? city : null;
}
