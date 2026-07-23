// FR-GLOWE-027 / D-62 — GloWe Supabase client factory (isolated session storage key).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** D-62 — separate GloWe session from KC's default `sb-<ref>-auth-token`. */
export const GLOWE_AUTH_STORAGE_KEY = 'glowe-auth-v1';

export type CreateGloweSupabaseClientOptions = {
  url: string;
  anonKey: string;
};

export function createGloweSupabaseClient(
  options: CreateGloweSupabaseClientOptions,
): SupabaseClient {
  return createClient(options.url, options.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: GLOWE_AUTH_STORAGE_KEY,
    },
  });
}
