// app/apps/mobile/src/services/__tests__/authSecureStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const asyncStore = new Map<string, string>();
const secureStore = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => asyncStore.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => { asyncStore.set(k, v); }),
    removeItem: vi.fn(async (k: string) => { asyncStore.delete(k); }),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (k: string) => secureStore.get(k) ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => { secureStore.set(k, v); }),
  deleteItemAsync: vi.fn(async (k: string) => { secureStore.delete(k); }),
}));

import { createAuthSecureStorage } from '../authSecureStorage';

beforeEach(() => {
  asyncStore.clear();
  secureStore.clear();
});

describe('authSecureStorage', () => {
  it('migrates an existing AsyncStorage value to SecureStore on first read', async () => {
    asyncStore.set('sb-token', 'legacy-session');
    const storage = createAuthSecureStorage();

    expect(await storage.getItem('sb-token')).toBe('legacy-session');
    expect(secureStore.get('sb-token')).toBe('legacy-session');
    expect(asyncStore.has('sb-token')).toBe(false);
  });

  it('reads from SecureStore on subsequent calls without touching AsyncStorage', async () => {
    secureStore.set('sb-token', 'fresh-session');
    const storage = createAuthSecureStorage();

    expect(await storage.getItem('sb-token')).toBe('fresh-session');
    expect(asyncStore.size).toBe(0);
  });

  it('writes go to SecureStore only', async () => {
    const storage = createAuthSecureStorage();
    await storage.setItem('sb-token', 'new-session');

    expect(secureStore.get('sb-token')).toBe('new-session');
    expect(asyncStore.has('sb-token')).toBe(false);
  });

  it('removes from both stores (defensive — covers half-migrated state)', async () => {
    asyncStore.set('sb-token', 'legacy');
    secureStore.set('sb-token', 'fresh');
    const storage = createAuthSecureStorage();

    await storage.removeItem('sb-token');

    expect(secureStore.has('sb-token')).toBe(false);
    expect(asyncStore.has('sb-token')).toBe(false);
  });
});
