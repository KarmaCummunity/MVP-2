// Maps the active i18next language code to a date-fns locale for relative-time formatting.

import { he } from 'date-fns/locale/he';
import type { Locale } from 'date-fns';

const LOCALES: Record<string, Locale> = {
  he,
  'he-IL': he,
};

export function resolveDateFnsLocale(language: string): Locale {
  return LOCALES[language] ?? LOCALES[language.split('-')[0] ?? ''] ?? he;
}
