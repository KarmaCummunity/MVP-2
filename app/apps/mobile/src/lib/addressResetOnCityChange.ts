// Pure helper for the "switching city invalidates the street + number"
// behavior used everywhere a user can pick both a city and a street
// (onboarding, edit profile, create post, edit post).
//
// The rule: when the city ID changes (including being cleared to null), the
// previously typed street + street-number must be reset to empty so the user
// never submits a Tel Aviv street under a Jerusalem city.

export interface AddressPair {
  readonly street: string;
  readonly streetNumber: string;
}

export interface AddressResetInput {
  readonly prevCityId: string | null | undefined;
  readonly nextCityId: string | null | undefined;
  readonly street: string;
  readonly streetNumber: string;
}

/** Returns the next street + streetNumber, possibly reset to empty. */
export function applyAddressResetOnCityChange(input: AddressResetInput): AddressPair {
  // Normalize undefined to null for a single equality comparison.
  const prev = input.prevCityId ?? null;
  const next = input.nextCityId ?? null;
  if (prev === next) {
    return { street: input.street, streetNumber: input.streetNumber };
  }
  return { street: '', streetNumber: '' };
}
