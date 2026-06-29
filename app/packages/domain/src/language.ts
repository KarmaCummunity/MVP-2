import { ValidationError } from './errors';

/** A validated, normalized BCP-47 language tag (e.g. 'he', 'en', 'pt-BR', 'zh-Hant'). */
export type LanguageTag = string & { readonly __brand: 'LanguageTag' };

// language(2-3 alpha) [-script(4 alpha)] [-region(2 alpha | 3 digit)]
const BCP47 = /^[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|[0-9]{3}))?$/i;

/**
 * Validate + normalize a raw string into a LanguageTag.
 * Pragmatic BCP-47 subset: language, optional script, optional region.
 * Throws ValidationError(field='languageTag') when invalid.
 */
export function createLanguageTag(raw: string): LanguageTag {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) throw new ValidationError('LanguageTag: value is required', 'languageTag');
  if (!BCP47.test(trimmed)) {
    throw new ValidationError(`LanguageTag: '${raw}' is not a valid BCP-47 tag`, 'languageTag');
  }
  const parts = trimmed.split('-');
  const out: string[] = [parts[0].toLowerCase()];
  for (const part of parts.slice(1)) {
    if (/^[a-z]{4}$/i.test(part)) {
      out.push(part[0].toUpperCase() + part.slice(1).toLowerCase()); // script: Title
    } else {
      out.push(part.toUpperCase()); // region: UPPER (digits unaffected)
    }
  }
  return out.join('-') as LanguageTag;
}
