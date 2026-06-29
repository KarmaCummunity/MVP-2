import type { ContentType, TranslationField } from '@kc/domain';

export interface CachedTranslation {
  contentType: ContentType;
  contentId: string;
  field: TranslationField;
  targetLanguage: string;
  sourceLanguage: string | null;
  translatedText: string;
  model: string | null;
  confidence: number | null;
}

export interface TranslationCacheKey {
  contentType: ContentType;
  contentId: string;
  field: TranslationField;
  targetLanguage: string;
}

export interface ITranslationCacheRepository {
  /** FR-TRANSLATE-002 — return the cached translation for a key, or null on miss. */
  get(key: TranslationCacheKey): Promise<CachedTranslation | null>;

  /**
   * Insert a translation only if absent (single-flight via the table's UNIQUE).
   * Returns true if this call inserted the row, false if a row already existed.
   */
  putIfAbsent(row: CachedTranslation): Promise<boolean>;

  /** Remove all cached translations for a piece of content (used on source edit/correction). */
  deleteForContent(contentType: ContentType, contentId: string): Promise<void>;
}
