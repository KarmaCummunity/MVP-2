import type { LastAddress } from '../store/lastAddressStore';

/** Subset of `getEditableProfile` used for create-post address prefill. */
export interface ProfileAddressPrefillSource {
  // Nullable after migration 0084. The merger already guards on both being
  // truthy before building a city option, so null flows through safely.
  readonly city: string | null;
  readonly cityName: string | null;
  readonly profileStreet: string | null;
  readonly profileStreetNumber: string | null;
}

export interface MergedCreatePostAddress {
  readonly city: { id: string; name: string } | null;
  readonly street: string;
  readonly streetNumber: string;
}

/**
 * Profile-first merge: each line prefers the profile when non-empty after trim;
 * city prefers profile when ids exist; otherwise falls back to last-post address.
 */
export function mergeCreatePostAddressPrefill(
  profile: ProfileAddressPrefillSource | null,
  last: LastAddress,
): MergedCreatePostAddress {
  const fromLastCity =
    last.cityId && last.cityName ? { id: last.cityId, name: last.cityName } : null;
  const city =
    profile?.city && profile.cityName
      ? { id: profile.city, name: profile.cityName }
      : fromLastCity;
  const street =
    (profile?.profileStreet?.trim() ? profile.profileStreet.trim() : '') || last.street;
  const streetNumber =
    (profile?.profileStreetNumber?.trim() ? profile.profileStreetNumber.trim() : '') ||
    last.streetNumber;
  return { city, street, streetNumber };
}
