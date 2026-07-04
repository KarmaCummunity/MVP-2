// FR-TRANSLATE-003 — target languages offered to the reader. Mirror of the
// Edge Function allow-list (supabase/functions/translate/supportedLanguages.ts).
// Keep these two in sync: a tag offered here must be accepted there. Labels live
// in the he locale (settings.translationLanguageNames) to satisfy the no-inline-
// Hebrew source scan.
export interface TranslationLanguageOption {
  /** BCP-47 tag persisted to `users.preferred_language`. */
  readonly tag: string;
  /** i18n key for the Hebrew label. */
  readonly labelKey: string;
}

export const SUPPORTED_TRANSLATION_LANGUAGES: readonly TranslationLanguageOption[] = [
  { tag: 'he', labelKey: 'settings.translationLanguageNames.he' },
  { tag: 'en', labelKey: 'settings.translationLanguageNames.en' },
  { tag: 'ar', labelKey: 'settings.translationLanguageNames.ar' },
  { tag: 'ru', labelKey: 'settings.translationLanguageNames.ru' },
];
