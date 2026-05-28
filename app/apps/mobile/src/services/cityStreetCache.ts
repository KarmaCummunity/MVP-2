// AsyncStorage-backed cache for the cities / streets catalogs.
//
// Both datasets come from server-side seeds (migration 0008_seed_all_cities.sql
// and the streets ingest) and change rarely — but the cities list is 1306
// rows / two paged round-trips, so re-fetching on every cold open is the
// single worst part of onboarding latency. Caching on-device cuts the
// city-picker open-to-first-row from 600-1500ms cold to <100ms.
//
// Invalidation has two axes:
//   1. SCHEMA_VERSION — bump in lockstep when a migration alters the cities /
//      streets seed shape or contents in a way the cached payload can't
//      represent. Reading a mismatched version returns null (treated as miss).
//   2. TTL — 7 days. Safety net against silently-stale data when a seed
//      changes but SCHEMA_VERSION wasn't bumped.
//
// Mapped to spec: PERF-6 (smart caching, Shipment 3).

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { City, Street } from '@kc/domain';
import type { ICityRepository, IStreetRepository } from '@kc/application';

const SCHEMA_VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const KEY_CITIES = `kc:cities@v${SCHEMA_VERSION}`;
const KEY_STREETS = (cityId: string) => `kc:streets:${cityId}@v${SCHEMA_VERSION}`;

interface CacheEntry<T> {
  v: number;
  at: number;
  data: T;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.v !== SCHEMA_VERSION) return null;
    if (Date.now() - parsed.at > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { v: SCHEMA_VERSION, at: Date.now(), data };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // best-effort — caching is a UX win, not correctness-critical
  }
}

export class CachedCityRepository implements ICityRepository {
  constructor(private readonly inner: ICityRepository) {}

  async listAll(): Promise<City[]> {
    const cached = await readCache<City[]>(KEY_CITIES);
    if (cached) return cached;
    const fresh = await this.inner.listAll();
    void writeCache(KEY_CITIES, fresh);
    return fresh;
  }
}

export class CachedStreetRepository implements IStreetRepository {
  constructor(private readonly inner: IStreetRepository) {}

  async listByCity(cityId: string): Promise<Street[]> {
    if (!cityId) return [];
    const key = KEY_STREETS(cityId);
    const cached = await readCache<Street[]>(key);
    if (cached) return cached;
    const fresh = await this.inner.listByCity(cityId);
    void writeCache(key, fresh);
    return fresh;
  }
}

/**
 * Exposed for tests + ops debugging. Removes both cities and per-city street
 * caches via AsyncStorage prefix scan. Not part of normal app flow.
 */
export async function clearCityStreetCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith('kc:cities@') || k.startsWith('kc:streets:'));
    if (targets.length) await AsyncStorage.multiRemove(targets);
  } catch {
    // best-effort
  }
}
