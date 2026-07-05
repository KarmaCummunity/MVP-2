import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ITranslationCacheRepository,
  CachedTranslation,
  TranslationCacheKey,
} from '@kc/application';
import type { ContentType, TranslationField } from '@kc/domain';

const COLUMNS =
  'content_type, content_id, field, target_language, source_language, translated_text, model, confidence';

export class SupabaseTranslationCacheRepository implements ITranslationCacheRepository {
  constructor(private readonly client: SupabaseClient) {}

  async get(key: TranslationCacheKey): Promise<CachedTranslation | null> {
    const { data, error } = await this.client
      .from('content_translations')
      .select(COLUMNS)
      .eq('content_type', key.contentType)
      .eq('content_id', key.contentId)
      .eq('field', key.field)
      .eq('target_language', key.targetLanguage)
      .maybeSingle();
    if (error) throw new Error(`getTranslation: ${error.message}`);
    return data ? mapRow(data) : null;
  }

  async putIfAbsent(row: CachedTranslation): Promise<boolean> {
    const { error } = await this.client.from('content_translations').insert({
      content_type: row.contentType,
      content_id: row.contentId,
      field: row.field,
      target_language: row.targetLanguage,
      source_language: row.sourceLanguage,
      translated_text: row.translatedText,
      model: row.model,
      confidence: row.confidence,
    });
    if (!error) return true;
    if ((error as { code?: string }).code === '23505') return false; // unique violation = already cached
    throw new Error(`putIfAbsent: ${error.message}`);
  }

  async deleteForContent(contentType: ContentType, contentId: string): Promise<void> {
    const { error } = await this.client
      .from('content_translations')
      .delete()
      .eq('content_type', contentType)
      .eq('content_id', contentId);
    if (error) throw new Error(`deleteForContent: ${error.message}`);
  }
}

function mapRow(r: Record<string, unknown>): CachedTranslation {
  return {
    contentType: r.content_type as ContentType,
    contentId: r.content_id as string,
    field: r.field as TranslationField,
    targetLanguage: r.target_language as string,
    sourceLanguage: (r.source_language as string | null) ?? null,
    translatedText: r.translated_text as string,
    model: (r.model as string | null) ?? null,
    confidence: (r.confidence as number | null) ?? null,
  };
}
