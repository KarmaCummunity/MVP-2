// supabase/functions/_shared/translation/provider.ts
// Pluggable translation-provider seam shared by the KC `translate` and GLOWE
// `glowe-translate` Edge Functions. Swapping providers (e.g. free Gemini ->
// paid zero-retention/DPA Flash, D-63/D-65) is a TRANSLATION_PROVIDER env change.

export interface ProviderInput {
  text: string;
  /** BCP-47 target, may be variant-specific (e.g. zh-Hant). */
  targetLanguage: string;
  /** Optional hint; the provider still self-detects (§8). */
  sourceHint?: string | null;
}

export interface ProviderResult {
  translatedText: string;
  detectedSourceLanguage: string | null;
  /** 0..1 self-rated confidence; null when the provider gives none. */
  confidence: number | null;
  /** Model/provider id stored as provenance in *_content_translations.model. */
  model: string;
}

export interface TranslationProvider {
  translate(input: ProviderInput): Promise<ProviderResult>;
}

import { GeminiFlashProvider } from './gemini.ts';

export function selectProvider(): TranslationProvider {
  const kind = (Deno.env.get('TRANSLATION_PROVIDER') ?? 'gemini').toLowerCase();
  switch (kind) {
    case 'gemini':
      return new GeminiFlashProvider();
    default:
      throw new Error(`unknown TRANSLATION_PROVIDER '${kind}'`);
  }
}
