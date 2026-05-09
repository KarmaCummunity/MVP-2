// Persists the last-used address from the Create Post flow so the next post
// pre-fills city / street / number. Editable per-post (the user can change any
// field; we save again on successful publish). Mirrors filterStore's persist
// shape (zustand/middleware + AsyncStorage).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LastAddress {
  cityId: string | null;
  cityName: string | null;
  street: string;
  streetNumber: string;
}

interface LastAddressState extends LastAddress {
  setLastAddress: (next: LastAddress) => void;
  clear: () => void;
}

const EMPTY: LastAddress = {
  cityId: null,
  cityName: null,
  street: '',
  streetNumber: '',
};

export const useLastAddressStore = create<LastAddressState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setLastAddress: (next) => set(next),
      clear: () => set(EMPTY),
    }),
    {
      name: 'kc-last-address',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        cityId: s.cityId,
        cityName: s.cityName,
        street: s.street,
        streetNumber: s.streetNumber,
      }),
    },
  ),
);
