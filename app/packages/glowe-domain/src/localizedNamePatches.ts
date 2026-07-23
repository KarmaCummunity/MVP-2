import { isPrimarilyLatinName, trim, type GloweProfileNameInput } from './localizedNameCore';

export interface GloweEnglishNamePatch {
  id: string;
  displayNameEn?: string;
  orgNameEn?: string;
}

export interface GloweAuthorEnglishRow {
  authorName?: string | null;
  authorNameEn?: string | null;
  author?: string | null;
  authorEn?: string | null;
  authorId?: string;
  userId?: string;
  [key: string]: unknown;
}

export function englishNameOrCopy(primary: string, english: string): string {
  const e = trim(english);
  if (e) return e;
  const p = trim(primary);
  if (p && isPrimarilyLatinName(p)) return p;
  return '';
}

export function profileNeedsEnglishName(profile: GloweProfileNameInput | null | undefined): boolean {
  const p = profile || {};
  const isOrg = p.accountType === 'organization';
  if (isOrg) {
    const primary = trim(p.orgName || p.name);
    const english = trim(p.orgNameEn || p.nameEn);
    return Boolean(primary) && !english && !isPrimarilyLatinName(primary);
  }
  const primary = trim(p.name);
  const english = trim(p.nameEn);
  return Boolean(primary) && !english && !isPrimarilyLatinName(primary);
}

export function applyEnglishNamePatches<T extends GloweProfileNameInput>(
  profiles: T[] | null | undefined,
  patches: GloweEnglishNamePatch[] | null | undefined,
): T[] {
  const byId: Record<string, GloweEnglishNamePatch> = {};
  (patches || []).forEach((patch) => {
    if (patch?.id) byId[String(patch.id)] = patch;
  });
  return (profiles || []).map((profile) => {
    if (!profile?.id) return profile;
    const patch = byId[String(profile.id)];
    if (!patch) return profile;
    const next = { ...profile };
    if (patch.displayNameEn) next.nameEn = patch.displayNameEn;
    if (patch.orgNameEn) next.orgNameEn = patch.orgNameEn;
    return next;
  });
}

export function englishFromProfilePatch(patch: GloweEnglishNamePatch | null | undefined): string {
  if (!patch) return '';
  return trim(patch.orgNameEn) || trim(patch.displayNameEn) || '';
}

export function applyAuthorEnglishFromProfiles<T extends GloweAuthorEnglishRow>(
  items: T[] | null | undefined,
  patches: GloweEnglishNamePatch[] | null | undefined,
  idKeys?: string[],
): T[] {
  const keys = idKeys?.length ? idKeys : ['authorId', 'userId'];
  const byId: Record<string, string> = {};
  (patches || []).forEach((patch) => {
    if (patch?.id) byId[String(patch.id)] = englishFromProfilePatch(patch);
  });
  // fallow-ignore-next-line complexity
  return (items || []).map((item) => {
    if (!item) return item;
    const existing = trim(item.authorNameEn) || trim(item.authorEn);
    if (existing) return item;
    let authorId = '';
    for (const key of keys) {
      const value = item[key];
      if (value) {
        authorId = String(value);
        break;
      }
    }
    const english = authorId ? byId[authorId] : '';
    if (!english) return item;
    const next = { ...item };
    if (Object.prototype.hasOwnProperty.call(item, 'authorName') || Object.prototype.hasOwnProperty.call(item, 'authorNameEn')) {
      next.authorNameEn = english;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'author') || Object.prototype.hasOwnProperty.call(item, 'authorEn')) {
      next.authorEn = english;
    }
    return next;
  });
}

export function authorNeedsEnglishName(row: GloweAuthorEnglishRow | null | undefined): boolean {
  const r = row || {};
  const primary = trim(r.authorName != null ? r.authorName : r.author);
  const english = trim(r.authorNameEn != null ? r.authorNameEn : r.authorEn || '');
  return Boolean(primary) && !english && !isPrimarilyLatinName(primary);
}
