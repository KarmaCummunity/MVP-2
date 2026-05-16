import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: (k: string) => Promise.resolve(store.get(k) ?? null),
      setItem: (k: string, v: string) => Promise.resolve(void store.set(k, v)),
      removeItem: (k: string) => Promise.resolve(void store.delete(k)),
    },
  };
});

import { useLastAddressStore, type LastAddress } from '../lastAddressStore';

beforeEach(() => {
  useLastAddressStore.getState().clear();
});

describe('useLastAddressStore', () => {
  it('starts empty (all fields at their canonical zero values)', () => {
    const s = useLastAddressStore.getState();
    expect(s.cityId).toBeNull();
    expect(s.cityName).toBeNull();
    expect(s.street).toBe('');
    expect(s.streetNumber).toBe('');
  });

  it('setLastAddress replaces all four fields together', () => {
    const next: LastAddress = {
      cityId: 'IL-001', cityName: 'Tel Aviv', street: 'Main', streetNumber: '12',
    };
    useLastAddressStore.getState().setLastAddress(next);
    expect(useLastAddressStore.getState()).toMatchObject(next);
  });

  it('setLastAddress accepts null cityId + cityName (post-publish from a fully-empty form)', () => {
    useLastAddressStore.getState().setLastAddress({
      cityId: null, cityName: null, street: 'Main', streetNumber: '12',
    });
    const s = useLastAddressStore.getState();
    expect(s.cityId).toBeNull();
    expect(s.cityName).toBeNull();
    expect(s.street).toBe('Main');
    expect(s.streetNumber).toBe('12');
  });

  it('clear() resets every field back to its canonical zero value', () => {
    useLastAddressStore.getState().setLastAddress({
      cityId: 'IL-001', cityName: 'Tel Aviv', street: 'Main', streetNumber: '12',
    });
    useLastAddressStore.getState().clear();
    expect(useLastAddressStore.getState()).toMatchObject({
      cityId: null, cityName: null, street: '', streetNumber: '',
    });
  });

  it('repeated setLastAddress overwrites cleanly (no merge / no leftover fields)', () => {
    useLastAddressStore.getState().setLastAddress({
      cityId: 'IL-001', cityName: 'Tel Aviv', street: 'Main', streetNumber: '12',
    });
    useLastAddressStore.getState().setLastAddress({
      cityId: 'IL-002', cityName: 'Haifa', street: '', streetNumber: '',
    });
    expect(useLastAddressStore.getState()).toMatchObject({
      cityId: 'IL-002', cityName: 'Haifa', street: '', streetNumber: '',
    });
  });
});
