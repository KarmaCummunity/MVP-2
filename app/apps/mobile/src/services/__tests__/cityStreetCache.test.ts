import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { City, Street } from '@kc/domain';
import type { ICityRepository, IStreetRepository } from '@kc/application';

// Mock AsyncStorage with an in-memory map. Hoisted so module-level imports
// in cityStreetCache.ts pick up the mock before reaching the real native
// shim (which would crash under vitest).
const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
    multiRemove: async (keys: readonly string[]) => {
      for (const k of keys) store.delete(k);
    },
    getAllKeys: async () => [...store.keys()],
  },
}));

// Import AFTER the mock is registered.
const { CachedCityRepository, CachedStreetRepository, clearCityStreetCache } = await import(
  '../cityStreetCache'
);

const SAMPLE_CITIES: City[] = [
  { cityId: 'c1', nameHe: 'תל אביב', nameEn: 'Tel Aviv' },
  { cityId: 'c2', nameHe: 'ירושלים', nameEn: 'Jerusalem' },
];
const SAMPLE_STREETS: Street[] = [
  { streetId: 's1', name: 'Bialik' },
  { streetId: 's2', name: 'Dizengoff' },
] as unknown as Street[];

function makeCityInner(listAll: () => Promise<City[]>): ICityRepository {
  return { listAll };
}

function makeStreetInner(listByCity: (cityId: string) => Promise<Street[]>): IStreetRepository {
  return { listByCity };
}

beforeEach(() => {
  store.clear();
});

describe('CachedCityRepository', () => {
  it('first call goes to inner repo + persists to storage', async () => {
    const inner = vi.fn(async () => SAMPLE_CITIES);
    const repo = new CachedCityRepository(makeCityInner(inner));
    const out = await repo.listAll();
    expect(out).toEqual(SAMPLE_CITIES);
    expect(inner).toHaveBeenCalledTimes(1);
    // wait for the fire-and-forget write
    await new Promise((r) => setTimeout(r, 0));
    expect(store.size).toBe(1);
  });

  it('second call hits the cache — inner is NOT called again', async () => {
    const inner = vi.fn(async () => SAMPLE_CITIES);
    const repo = new CachedCityRepository(makeCityInner(inner));
    await repo.listAll();
    await new Promise((r) => setTimeout(r, 0));
    const out2 = await repo.listAll();
    expect(out2).toEqual(SAMPLE_CITIES);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('expired TTL forces re-fetch', async () => {
    const inner = vi.fn(async () => SAMPLE_CITIES);
    const repo = new CachedCityRepository(makeCityInner(inner));
    // Pre-populate storage with an expired entry.
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    store.set(
      'kc:cities@v1',
      JSON.stringify({ v: 1, at: eightDaysAgo, data: SAMPLE_CITIES }),
    );
    const out = await repo.listAll();
    expect(out).toEqual(SAMPLE_CITIES);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('schema-version mismatch forces re-fetch', async () => {
    const inner = vi.fn(async () => SAMPLE_CITIES);
    const repo = new CachedCityRepository(makeCityInner(inner));
    store.set(
      'kc:cities@v1',
      JSON.stringify({ v: 99, at: Date.now(), data: SAMPLE_CITIES }),
    );
    const out = await repo.listAll();
    expect(out).toEqual(SAMPLE_CITIES);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('corrupt cache payload falls back to inner without throwing', async () => {
    const inner = vi.fn(async () => SAMPLE_CITIES);
    const repo = new CachedCityRepository(makeCityInner(inner));
    store.set('kc:cities@v1', '{not-json');
    const out = await repo.listAll();
    expect(out).toEqual(SAMPLE_CITIES);
    expect(inner).toHaveBeenCalledTimes(1);
  });
});

describe('CachedStreetRepository', () => {
  it('caches per-city under separate keys', async () => {
    const inner = vi.fn(async (cityId: string) => (cityId === 'c1' ? SAMPLE_STREETS : []));
    const repo = new CachedStreetRepository(makeStreetInner(inner));
    await repo.listByCity('c1');
    await repo.listByCity('c2');
    await new Promise((r) => setTimeout(r, 0));
    expect(store.has('kc:streets:c1@v1')).toBe(true);
    expect(store.has('kc:streets:c2@v1')).toBe(true);
    expect(inner).toHaveBeenCalledTimes(2);

    // Second pass — both hit cache.
    await repo.listByCity('c1');
    await repo.listByCity('c2');
    expect(inner).toHaveBeenCalledTimes(2);
  });

  it('empty cityId short-circuits without touching inner or cache', async () => {
    const inner = vi.fn();
    const repo = new CachedStreetRepository(makeStreetInner(inner as never));
    const out = await repo.listByCity('');
    expect(out).toEqual([]);
    expect(inner).not.toHaveBeenCalled();
  });
});

describe('clearCityStreetCache', () => {
  it('removes both kc:cities and kc:streets entries; leaves unrelated keys alone', async () => {
    store.set('kc:cities@v1', '{}');
    store.set('kc:streets:c1@v1', '{}');
    store.set('kc:streets:c2@v1', '{}');
    store.set('other-app-key', 'keep me');
    await clearCityStreetCache();
    expect([...store.keys()]).toEqual(['other-app-key']);
  });
});
