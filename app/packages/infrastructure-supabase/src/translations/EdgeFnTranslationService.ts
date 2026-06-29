// app/packages/infrastructure-supabase/src/translations/EdgeFnTranslationService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITranslationService, CachedTranslation } from '@kc/application';
import type { TranslationRequest } from '@kc/domain';

interface EdgeResponse {
  status: 'translated' | 'cached' | 'skipped';
  translation?: CachedTranslation;
}

export class EdgeFnTranslationService implements ITranslationService {
  constructor(private readonly client: SupabaseClient) {}

  async requestTranslation(
    request: TranslationRequest,
    sourceText: string,
  ): Promise<CachedTranslation | null> {
    const { data, error } = await this.client.functions.invoke<EdgeResponse>('translate', {
      body: {
        contentType: request.contentType,
        contentId: request.contentId,
        field: request.field,
        targetLanguage: request.targetLanguage,
        sourceText,
      },
    });
    if (error || !data || !data.translation) return null; // graceful degradation (§6)
    return data.translation;
  }
}
