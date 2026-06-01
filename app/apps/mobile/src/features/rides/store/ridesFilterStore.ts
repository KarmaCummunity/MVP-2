// Rides hub filters — FR-RIDE-002.
import { create } from 'zustand';
import type { RideMode } from '@kc/domain';

interface RidesFilterState {
  searchQuery: string;
  originCityId: string | null;
  originCityName: string | null;
  destCityId: string | null;
  destCityName: string | null;
  mode: RideMode | null;
  departFrom: string | null;
  departTo: string | null;

  setSearchQuery: (q: string) => void;
  setOriginCity: (id: string | null, name: string | null) => void;
  setDestCity: (id: string | null, name: string | null) => void;
  setMode: (mode: RideMode | null) => void;
  setDepartRange: (from: string | null, to: string | null) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;
}

const DEFAULTS = {
  searchQuery: '',
  originCityId: null as string | null,
  originCityName: null as string | null,
  destCityId: null as string | null,
  destCityName: null as string | null,
  mode: null as RideMode | null,
  departFrom: null as string | null,
  departTo: null as string | null,
};

export const useRidesFilterStore = create<RidesFilterState>((set, get) => ({
  ...DEFAULTS,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setOriginCity: (originCityId, originCityName) => set({ originCityId, originCityName }),
  setDestCity: (destCityId, destCityName) => set({ destCityId, destCityName }),
  setMode: (mode) => set({ mode }),
  setDepartRange: (departFrom, departTo) => set({ departFrom, departTo }),
  clearFilters: () => set({ ...DEFAULTS }),

  activeFilterCount: () => {
    const s = get();
    let n = 0;
    if (s.originCityId) n += 1;
    if (s.destCityId) n += 1;
    if (s.mode) n += 1;
    if (s.departFrom || s.departTo) n += 1;
    return n;
  },
}));
