import type { User } from '@kc/domain';

/** City, or city + street + number when the user saved a full profile address (FR-PROFILE-007). */
export function formatUserLocationLine(
  u: Pick<User, 'cityName' | 'profileStreet' | 'profileStreetNumber'>,
): string {
  if (u.profileStreet && u.profileStreetNumber) {
    return `${u.cityName}, ${u.profileStreet} ${u.profileStreetNumber}`;
  }
  return u.cityName;
}
