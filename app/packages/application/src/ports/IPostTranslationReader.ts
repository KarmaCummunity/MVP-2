// app/packages/application/src/ports/IPostTranslationReader.ts
import type { TranslationField } from '@kc/domain';

/**
 * FR-TRANSLATE-002 (Phase 1c) — read seam over the `get_post_translations`
 * SECURITY INVOKER RPC. Returns cached post translations for the reader's
 * target language; posts RLS filters visibility before the join, so rows for
 * invisible posts are never returned.
 */
export interface PostTranslationHit {
  postId: string;
  field: TranslationField;
  sourceLanguage: string | null;
  translatedText: string;
  confidence: number | null;
}

export interface IPostTranslationReader {
  /**
   * Batch-read cached translations for the given post ids in one round-trip.
   * Misses are simply absent from the result (no row). Returns `[]` when none
   * are cached or all posts are invisible to the caller.
   */
  getForPosts(postIds: string[], targetLanguage: string): Promise<PostTranslationHit[]>;
}
