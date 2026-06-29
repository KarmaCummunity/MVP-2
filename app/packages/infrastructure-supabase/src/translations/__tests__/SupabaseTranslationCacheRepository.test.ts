import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTranslationCacheRepository } from '../SupabaseTranslationCacheRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROW = {
  content_type: 'post', content_id: 'p1', field: 'title',
  target_language: 'en', source_language: 'he',
  translated_text: 'Hello', model: 'flash', confidence: 0.9,
};

function makeClient(opts: {
  selectData?: any; selectError?: any;
  insertError?: any; insertConflict?: boolean;
} = {}) {
  const calls: any = { selectFilters: {}, inserted: undefined, deletedFilters: {} };
  const client = {
    from() {
      return {
        select() {
          return {
            eq(col: string, val: unknown) {
              calls.selectFilters[col] = val;
              return this;
            },
            maybeSingle: async () => ({ data: opts.selectData ?? null, error: opts.selectError ?? null }),
          };
        },
        insert(row: any) {
          calls.inserted = row;
          // PostgREST returns code 23505 on unique violation.
          const error = opts.insertConflict ? { code: '23505', message: 'dup' } : (opts.insertError ?? null);
          return Promise.resolve({ error });
        },
        delete() {
          return {
            eq(col: string, val: unknown) { calls.deletedFilters[col] = val; return this; },
          };
        },
      };
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('SupabaseTranslationCacheRepository', () => {
  it('get() returns a mapped row on hit', async () => {
    const { client } = makeClient({ selectData: ROW });
    const repo = new SupabaseTranslationCacheRepository(client);
    const out = await repo.get({ contentType: 'post', contentId: 'p1', field: 'title', targetLanguage: 'en' });
    expect(out?.translatedText).toBe('Hello');
    expect(out?.sourceLanguage).toBe('he');
  });

  it('get() returns null on miss', async () => {
    const { client } = makeClient({ selectData: null });
    const repo = new SupabaseTranslationCacheRepository(client);
    expect(await repo.get({ contentType: 'post', contentId: 'p1', field: 'title', targetLanguage: 'en' })).toBeNull();
  });

  it('putIfAbsent() returns true when inserted', async () => {
    const { client, calls } = makeClient({});
    const repo = new SupabaseTranslationCacheRepository(client);
    const inserted = await repo.putIfAbsent({
      contentType: 'post', contentId: 'p1', field: 'title', targetLanguage: 'en',
      sourceLanguage: 'he', translatedText: 'Hello', model: 'flash', confidence: 0.9,
    });
    expect(inserted).toBe(true);
    expect(calls.inserted).toMatchObject({ content_type: 'post', target_language: 'en', translated_text: 'Hello' });
  });

  it('putIfAbsent() returns false on unique conflict (single-flight loser)', async () => {
    const { client } = makeClient({ insertConflict: true });
    const repo = new SupabaseTranslationCacheRepository(client);
    const inserted = await repo.putIfAbsent({
      contentType: 'post', contentId: 'p1', field: 'title', targetLanguage: 'en',
      sourceLanguage: 'he', translatedText: 'Hello', model: 'flash', confidence: 0.9,
    });
    expect(inserted).toBe(false);
  });

  it('putIfAbsent() throws on a non-conflict error', async () => {
    const { client } = makeClient({ insertError: { code: '42501', message: 'rls' } });
    const repo = new SupabaseTranslationCacheRepository(client);
    await expect(repo.putIfAbsent({
      contentType: 'post', contentId: 'p1', field: 'title', targetLanguage: 'en',
      sourceLanguage: 'he', translatedText: 'Hello', model: null, confidence: null,
    })).rejects.toThrow('putIfAbsent');
  });
});
