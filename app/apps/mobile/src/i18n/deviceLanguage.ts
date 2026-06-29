import { getLocales } from 'expo-localization';
import { resolvePreferredLanguage, type LanguageTag } from '@kc/domain';

/** Raw BCP-47 tags from the device, most-preferred first (may be empty). */
export function getDeviceLanguageTags(): string[] {
  return getLocales()
    .map((l) => l.languageTag)
    .filter((t): t is string => Boolean(t));
}

/**
 * Effective reader language: stored user preference, else device locale, else Hebrew.
 * `userPreference` is `users.preferred_language` (nullable).
 */
export function resolveReaderLanguage(userPreference: string | null): LanguageTag {
  return resolvePreferredLanguage({
    userPreference,
    deviceLocales: getDeviceLanguageTags(),
    fallback: 'he',
  });
}
