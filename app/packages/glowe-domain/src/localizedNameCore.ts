// GloWe bilingual display names (FR-GLOWE-024).
// Non-Latin letter scripts that need an English variant.
const NON_LATIN = /[\u0590-\u05FF\u0600-\u06FF\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF]/;

export function trim(value: unknown): string {
  return String(value == null ? '' : value).trim();
}

/** True when the text has no Hebrew/Arabic/Cyrillic/Greek/CJK letters. */
export function isPrimarilyLatinName(text: string): boolean {
  const t = trim(text);
  if (!t) return true;
  return !NON_LATIN.test(t);
}

/** @deprecated Use {@link isPrimarilyLatinName}. */
export const isPrimarilyLatin = isPrimarilyLatinName;

/** Reader language: EN prefers the English column; otherwise the primary name. */
export function resolveLocalizedName(primary: string, english: string, lang: string): string {
  const p = trim(primary);
  const e = trim(english);
  if (String(lang || '').toLowerCase().split('-')[0] === 'en') {
    return e || p || '';
  }
  return p || e || '';
}

export interface GloweProfileNameInput {
  id?: string;
  accountType?: string;
  orgName?: string;
  orgNameEn?: string;
  name?: string;
  nameEn?: string;
}

export interface GloweNamePair {
  primary: string;
  english: string;
}

export function profileNamePair(profile: GloweProfileNameInput | null | undefined): GloweNamePair {
  const p = profile || {};
  const isOrg = p.accountType === 'organization';
  if (isOrg) {
    return {
      primary: trim(p.orgName || p.name),
      english: trim(p.orgNameEn || p.nameEn),
    };
  }
  return {
    primary: trim(p.name),
    english: trim(p.nameEn),
  };
}

export function localizedProfileName(profile: GloweProfileNameInput | null | undefined, lang: string): string {
  const p = profile || {};
  const isOrg = p.accountType === 'organization';
  if (isOrg) {
    return (
      resolveLocalizedName(p.orgName || p.name || '', p.orgNameEn || p.nameEn || '', lang) || 'Organization'
    );
  }
  return resolveLocalizedName(p.name || '', p.nameEn || '', lang) || 'GloWe Member';
}

export function localizedFirstName(
  profile: GloweProfileNameInput | null | undefined,
  lang: string,
  fallback?: string,
): string {
  const display = localizedProfileName(profile, lang) || fallback || 'there';
  return display.split(/\s+/).filter(Boolean)[0] || fallback || 'there';
}

export interface GloweAuthorRow {
  authorName?: string | null;
  authorNameEn?: string | null;
  author_name?: string | null;
  author_name_en?: string | null;
}

export function localizedAuthorName(
  row: GloweAuthorRow | null | undefined,
  lang: string,
  fallback?: string,
): string {
  const r = row || {};
  const primary = r.authorName != null ? r.authorName : r.author_name;
  const english = r.authorNameEn != null ? r.authorNameEn : r.author_name_en;
  return resolveLocalizedName(primary || '', english || '', lang) || fallback || 'Community Member';
}

export interface GloweOrganizationRow {
  organization?: string;
  organizationEn?: string;
  organization_en?: string;
}

export function localizedOrganizationName(
  row: GloweOrganizationRow | null | undefined,
  lang: string,
  fallback?: string,
): string {
  const r = row || {};
  const primary = r.organization;
  const english = r.organizationEn != null ? r.organizationEn : r.organization_en;
  return resolveLocalizedName(primary || '', english || '', lang) || fallback || 'GloWe Member';
}

export function nameForToggleView(
  primary: string,
  english: string,
  lang: string,
  showingSource: boolean,
): string {
  if (showingSource) return trim(primary) || trim(english) || '';
  return resolveLocalizedName(primary, english, lang);
}

export function initialsForName(name: string): string {
  return (
    String(name || '')
      .replace(/&/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'GW'
  );
}

const NAME_MARK_CLASSES = ['entity-mark', 'avatar', 'comment-avatar', 'wish-image'] as const;

export interface ToggleNameElement {
  classList?: { contains(className: string): boolean };
  closest?(selector: string): ToggleNameElement | null;
  getAttribute?(name: string): string | null;
  textContent?: string;
}

export interface ToggleNameCard {
  querySelectorAll?(selector: string): Iterable<ToggleNameElement>;
}

function isNameMark(el: ToggleNameElement): boolean {
  if (!el?.classList) return false;
  return NAME_MARK_CLASSES.some((className) => el.classList!.contains(className));
}

export function applyToggleNamesInCard(
  card: ToggleNameCard | null | undefined,
  showingSource: boolean,
  lang: string,
): void {
  if (!card?.querySelectorAll) return;
  for (const el of card.querySelectorAll('[data-ln-primary]')) {
    if (el.closest?.('[data-tr-card]') !== card) continue;
    const primary = el.getAttribute?.('data-ln-primary') || '';
    const english = el.getAttribute?.('data-ln-english') || '';
    const text = nameForToggleView(primary, english, lang, showingSource);
    el.textContent = isNameMark(el) ? initialsForName(text) : text;
  }
}
