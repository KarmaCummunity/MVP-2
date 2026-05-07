// ─────────────────────────────────────────────
// Supabase Client Factory
// Mapped to SRS Part V § 5.1–5.2
// ─────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let _client: SupabaseClient<Database> | null = null;

/** AsyncStorage-shaped adapter (RN) or compatible sync storage. */
export type SupabaseAuthStorage = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

/**
 * Returns a singleton Supabase client.
 * Must be called after env vars are available.
 *
 * In React Native / Expo: pass AsyncStorage as the storage adapter.
 * In Node (Edge Functions): no storage adapter needed.
 */
export function getSupabaseClient(options?: {
  url?: string;
  anonKey?: string;
  storage?: SupabaseAuthStorage;
}): SupabaseClient<Database> {
  if (_client) return _client;

  const url = options?.url ?? (typeof process !== 'undefined'
    ? (process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'] ?? '')
    : '');

  const anonKey = options?.anonKey ?? (typeof process !== 'undefined'
    ? (process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_ANON_KEY'] ?? '')
    : '');

  if (!url || !anonKey) {
    throw new Error(
      'Supabase: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  // Web: the OAuth redirect lands as a full page navigation — let the SDK consume `?code` from
  // window.location and exchange it. Native: we drive the browser via WebBrowser, so opt out.
  const detectSessionInUrl =
    typeof window !== 'undefined' && typeof window.location !== 'undefined';

  _client = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl,
      flowType: 'pkce',
      ...(options?.storage ? { storage: options.storage } : {}),
    },
  });

  return _client;
}

/** Reset the singleton (useful in tests). */
export function resetSupabaseClient(): void {
  _client = null;
}
