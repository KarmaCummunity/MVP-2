import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

type QueryResult = { data: unknown; error: unknown };

export function mockSupabaseClient(options: {
  user?: { id: string; email?: string } | null;
  profileRow?: Record<string, unknown> | null;
  profileRows?: Record<string, unknown>[];
  upsertRow?: Record<string, unknown> | null;
  invokeResult?: { data: unknown; error: unknown };
  storagePublicUrl?: string;
} = {}): SupabaseClient {
  const {
    user = { id: USER_ID, email: 'u@test.com' },
    profileRow = null,
    profileRows = [],
    upsertRow = profileRow,
    invokeResult = { data: null, error: null },
    storagePublicUrl = 'https://cdn.example/avatar.jpg',
  } = options;

  const maybeSingle = vi.fn(async (): Promise<QueryResult> => ({
    data: profileRow,
    error: null,
  }));
  const single = vi.fn(async (): Promise<QueryResult> => ({
    data: upsertRow ?? profileRow,
    error: null,
  }));

  const order = vi.fn(async (): Promise<QueryResult> => ({
    data: profileRows,
    error: null,
  }));

  const eqChain = {
    maybeSingle,
    single,
    order,
    eq: vi.fn(() => eqChain),
  };

  const select = vi.fn(() => eqChain);
  const upsert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
  const del = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const from = vi.fn(() => ({ select, upsert, delete: del }));

  const upload = vi.fn(async () => ({ error: null }));
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: storagePublicUrl } }));
  const storageFrom = vi.fn(() => ({ upload, getPublicUrl }));

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user } })),
    },
    from,
    functions: { invoke: vi.fn(async () => invokeResult) },
    storage: { from: storageFrom },
  } as unknown as SupabaseClient;
}
