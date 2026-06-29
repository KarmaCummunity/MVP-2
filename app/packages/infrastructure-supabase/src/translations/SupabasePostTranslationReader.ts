import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPostTranslationReader, PostTranslationHit } from '@kc/application';
import type { TranslationField } from '@kc/domain';

/**
 * FR-TRANSLATE-002 (Phase 1c) — calls the `get_post_translations` SECURITY
 * INVOKER RPC. The RPC joins through `posts`, so posts RLS filters visibility
 * before any translation row is returned. Misses are simply absent rows.
 */
export class SupabasePostTranslationReader implements IPostTranslationReader {
  constructor(private readonly client: SupabaseClient) {}

  async getForPosts(postIds: string[], targetLanguage: string): Promise<PostTranslationHit[]> {
    if (postIds.length === 0) return [];
    const { data, error } = await this.client.rpc('get_post_translations', {
      p_post_ids: postIds,
      p_target_language: targetLanguage,
    });
    if (error) throw new Error(`getPostTranslations: ${error.message}`);
    return (data ?? []).map(mapRow);
  }
}

function mapRow(r: {
  post_id: string;
  field: string;
  source_language: string | null;
  translated_text: string;
  confidence: number | null;
}): PostTranslationHit {
  return {
    postId: r.post_id,
    field: r.field as TranslationField,
    sourceLanguage: r.source_language ?? null,
    translatedText: r.translated_text,
    confidence: r.confidence ?? null,
  };
}
