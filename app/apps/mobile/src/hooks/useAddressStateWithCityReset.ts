// Address-state hook used by every surface that has a (city, street, number)
// trio (onboarding basic-info, edit profile, edit post). When the city ID
// changes — including null transitions — street + number reset to empty so
// the user never submits a Tel Aviv street under a Jerusalem city.

import { useCallback, useState } from 'react';
import { applyAddressResetOnCityChange } from '../lib/addressResetOnCityChange';

export type AddressCity = { id: string; name: string } | null;

export interface AddressStateWithCityReset {
  readonly city: AddressCity;
  readonly street: string;
  readonly streetNumber: string;
  setCity(next: AddressCity): void;
  setStreet(next: string): void;
  setStreetNumber(next: string): void;
}

export function useAddressStateWithCityReset(initial: {
  city?: AddressCity;
  street?: string;
  streetNumber?: string;
}): AddressStateWithCityReset {
  const [city, _setCity] = useState<AddressCity>(initial.city ?? null);
  const [street, setStreet] = useState(initial.street ?? '');
  const [streetNumber, setStreetNumber] = useState(initial.streetNumber ?? '');

  const setCity = useCallback(
    (next: AddressCity) => {
      _setCity((prev) => {
        const reset = applyAddressResetOnCityChange({
          prevCityId: prev?.id,
          nextCityId: next?.id,
          street,
          streetNumber,
        });
        if (reset.street !== street) setStreet(reset.street);
        if (reset.streetNumber !== streetNumber) setStreetNumber(reset.streetNumber);
        return next;
      });
    },
    [street, streetNumber],
  );

  return { city, street, streetNumber, setCity, setStreet, setStreetNumber };
}
