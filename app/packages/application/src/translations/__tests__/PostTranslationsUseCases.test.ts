import { describe, it, expect } from 'vitest';
import {
  GetTranslatedPostsUseCase,
  MaterializePostTranslationsUseCase,
  type TranslatablePostField,
} from '../PostTranslationsUseCases';
import type { IPostTranslationReader, PostTranslationHit } from '../../ports/IPostTranslationReader';
import type { ITranslationService, CachedTranslation } from '../../index';
import type { TranslationRequest } from '@kc/domain';

function makeReader(hits: PostTranslationHit[]): {
  reader: IPostTranslationReader;
  calls: { postIds: string[]; targetLanguage: string }[];
} {
  const calls: { postIds: string[]; targetLanguage: string }[] = [];
  const reader: IPostTranslationReader = {
    async getForPosts(postIds, targetLanguage) {
      calls.push({ postIds, targetLanguage });
      return hits;
    },
  };
  return { reader, calls };
}

const enHe = (postId: string, field: 'title' | 'description', text: string): TranslatablePostField => ({
  postId,
  field,
  sourceLanguage: 'he',
  text,
});

describe('GetTranslatedPostsUseCase', () => {
  it('returns reader hits and reports the remaining fields as misses', async () => {
    const hit: PostTranslationHit = {
      postId: 'p1',
      field: 'title',
      sourceLanguage: 'he',
      translatedText: 'Hello',
      confidence: 0.9,
    };
    const { reader, calls } = makeReader([hit]);
    const uc = new GetTranslatedPostsUseCase(reader);

    const out = await uc.execute({
      fields: [enHe('p1', 'title', 'שלום'), enHe('p1', 'description', 'תיאור')],
      targetLanguage: 'en',
    });

    expect(out.hits).toEqual([hit]);
    expect(out.misses).toEqual([enHe('p1', 'description', 'תיאור')]);
    // batched to a single round-trip over the distinct post ids.
    expect(calls).toEqual([{ postIds: ['p1'], targetLanguage: 'en' }]);
  });

  it('skips untranslatable and same-language fields without calling the reader', async () => {
    const { reader, calls } = makeReader([]);
    const uc = new GetTranslatedPostsUseCase(reader);

    const out = await uc.execute({
      fields: [
        { postId: 'p1', field: 'title', sourceLanguage: 'en', text: 'Already English' }, // same base lang
        { postId: 'p2', field: 'title', sourceLanguage: 'he', text: '😀😀' }, // emoji-only
        { postId: 'p3', field: 'title', sourceLanguage: 'he', text: 'https://x.io' }, // url-only
      ],
      targetLanguage: 'en',
    });

    expect(out).toEqual({ hits: [], misses: [] });
    expect(calls).toEqual([]); // nothing eligible → no DB round-trip
  });

  it('deduplicates post ids passed to the reader', async () => {
    const { reader, calls } = makeReader([]);
    const uc = new GetTranslatedPostsUseCase(reader);

    await uc.execute({
      fields: [enHe('p1', 'title', 'שלום'), enHe('p1', 'description', 'תיאור')],
      targetLanguage: 'en',
    });

    expect(calls[0]?.postIds).toEqual(['p1']);
  });
});

function makeService(
  fn: (req: TranslationRequest, text: string) => Promise<CachedTranslation | null>,
): { service: ITranslationService; seen: { req: TranslationRequest; text: string }[] } {
  const seen: { req: TranslationRequest; text: string }[] = [];
  const service: ITranslationService = {
    async requestTranslation(req, text) {
      seen.push({ req, text });
      return fn(req, text);
    },
  };
  return { service, seen };
}

const cached = (postId: string, field: 'title' | 'description', text: string): CachedTranslation => ({
  contentType: 'post',
  contentId: postId,
  field,
  targetLanguage: 'en',
  sourceLanguage: 'he',
  translatedText: text,
  model: 'flash',
  confidence: 0.9,
});

describe('MaterializePostTranslationsUseCase', () => {
  it('translates each miss and collects produced rows', async () => {
    const { service, seen } = makeService(async (req) => cached(req.contentId, req.field as 'title', 'X'));
    const uc = new MaterializePostTranslationsUseCase(service);

    const out = await uc.execute({
      misses: [enHe('p1', 'title', 'שלום'), enHe('p2', 'description', 'תיאור')],
      targetLanguage: 'en',
    });

    expect(out).toHaveLength(2);
    expect(seen.map((s) => s.text)).toEqual(['שלום', 'תיאור']);
    expect(seen[0]?.req.contentType).toBe('post');
    expect(seen[0]?.req.targetLanguage).toBe('en');
  });

  it('drops nulls (skips/failures) so callers render the original', async () => {
    const { service } = makeService(async (req) =>
      req.contentId === 'p1' ? cached('p1', 'title', 'X') : null,
    );
    const uc = new MaterializePostTranslationsUseCase(service);

    const out = await uc.execute({
      misses: [enHe('p1', 'title', 'שלום'), enHe('p2', 'title', 'עולם')],
      targetLanguage: 'en',
    });

    expect(out).toHaveLength(1);
    expect(out[0]?.contentId).toBe('p1');
  });

  it('never throws when the service rejects — degrades gracefully', async () => {
    const { service } = makeService(async () => {
      throw new Error('network down');
    });
    const uc = new MaterializePostTranslationsUseCase(service);

    const out = await uc.execute({
      misses: [enHe('p1', 'title', 'שלום')],
      targetLanguage: 'en',
    });

    expect(out).toEqual([]);
  });
});
