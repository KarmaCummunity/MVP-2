import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePostTranslationReader } from '../SupabasePostTranslationReader';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROW = {
  post_id: 'p1', field: 'title', source_language: 'he',
  translated_text: 'Hello', confidence: 0.9,
};

function makeClient(opts: { data?: any; error?: any } = {}) {
  const calls: { fn?: string; args?: any } = {};
  const client = {
    rpc(fn: string, args: any) {
      calls.fn = fn;
      calls.args = args;
      return Promise.resolve({ data: opts.data ?? null, error: opts.error ?? null });
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('SupabasePostTranslationReader', () => {
  it('maps RPC rows into hits and forwards the batched args', async () => {
    const { client, calls } = makeClient({ data: [ROW] });
    const reader = new SupabasePostTranslationReader(client);

    const out = await reader.getForPosts(['p1'], 'en');

    expect(calls.fn).toBe('get_post_translations');
    expect(calls.args).toEqual({ p_post_ids: ['p1'], p_target_language: 'en' });
    expect(out).toEqual([
      { postId: 'p1', field: 'title', sourceLanguage: 'he', translatedText: 'Hello', confidence: 0.9 },
    ]);
  });

  it('returns [] without hitting the RPC when there are no post ids', async () => {
    const { client, calls } = makeClient({ data: [ROW] });
    const reader = new SupabasePostTranslationReader(client);

    expect(await reader.getForPosts([], 'en')).toEqual([]);
    expect(calls.fn).toBeUndefined();
  });

  it('returns [] on a null payload (no cached translations)', async () => {
    const { client } = makeClient({ data: null });
    const reader = new SupabasePostTranslationReader(client);
    expect(await reader.getForPosts(['p1'], 'en')).toEqual([]);
  });

  it('throws on an RPC error', async () => {
    const { client } = makeClient({ error: { message: 'boom' } });
    const reader = new SupabasePostTranslationReader(client);
    await expect(reader.getForPosts(['p1'], 'en')).rejects.toThrow('getPostTranslations');
  });
});
