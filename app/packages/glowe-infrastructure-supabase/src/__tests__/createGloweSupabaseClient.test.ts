import { describe, it, expect, vi, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CreateClientCall {
  url: string;
  anonKey: string;
  options: any;
}

const createClientCalls: CreateClientCall[] = [];

vi.mock('@supabase/supabase-js', () => ({
  createClient: (url: string, anonKey: string, options: any) => {
    createClientCalls.push({ url, anonKey, options });
    return { _isFakeClient: true };
  },
}));

import {
  createGloweSupabaseClient,
  GLOWE_AUTH_STORAGE_KEY,
} from '../client/createGloweSupabaseClient';

beforeEach(() => {
  createClientCalls.length = 0;
});

describe('createGloweSupabaseClient', () => {
  it('creates a client with the provided url and anon key', () => {
    createGloweSupabaseClient({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });

    expect(createClientCalls).toHaveLength(1);
    expect(createClientCalls[0]?.url).toBe('https://example.supabase.co');
    expect(createClientCalls[0]?.anonKey).toBe('test-anon-key');
  });

  it('uses glowe-auth-v1 storageKey per D-62', () => {
    createGloweSupabaseClient({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });

    expect(GLOWE_AUTH_STORAGE_KEY).toBe('glowe-auth-v1');
    expect(createClientCalls[0]?.options.auth.storageKey).toBe('glowe-auth-v1');
  });

  it('enables session persistence and auto-refresh', () => {
    createGloweSupabaseClient({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });

    const auth = createClientCalls[0]?.options.auth;
    expect(auth.autoRefreshToken).toBe(true);
    expect(auth.persistSession).toBe(true);
  });
});
