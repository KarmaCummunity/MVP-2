// Shared Supabase client factory for integration suites (Node < 22 needs ws transport).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

type IntegrationClient = SupabaseClient<Database>;

function realtimeOptions(): { transport?: typeof import('ws') } {
  if (typeof globalThis.WebSocket !== 'undefined') return {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws') as typeof import('ws');
    return { transport: ws };
  } catch {
    return {};
  }
}

export function createIntegrationClient(url: string, key: string): IntegrationClient {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: realtimeOptions(),
  });
}
