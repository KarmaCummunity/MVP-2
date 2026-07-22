// GloWe Wishing Well helpers (FR-GLOWE-006).

import type { ValidationResult } from './createSystem';

export interface WishRow {
  id?: string;
  post_type?: string;
  postType?: string;
  status?: string;
  title?: string;
  text?: string;
  wish_type?: string;
  wishType?: string;
  impact_area?: string;
  impactArea?: string;
  author_name?: string;
  authorName?: string;
  author_name_en?: string;
  authorNameEn?: string;
  user_id?: string;
  userId?: string;
  author_id?: string;
  authorId?: string;
  created_at?: string;
  createdAt?: string;
  location?: string;
}

export interface WishViewModel {
  id: string | undefined;
  type: string;
  title: string;
  description: string;
  author: string;
  authorEn: string;
  authorId: string;
  location: string;
  areas: readonly string[];
  time: string;
}

export interface WishFilters {
  type?: string;
  area?: string;
  location?: string;
}

export interface WishDraft {
  title?: string;
  wish_type?: string;
  impact_area?: string;
  details?: string;
  success?: string;
  location?: string;
}

export interface OfferDraft {
  offer_text?: string;
  availability?: string;
  support_type?: string;
  message?: string;
}

function field<T>(
  row: WishRow | null | undefined,
  snake: keyof WishRow,
  camel: keyof WishRow,
): T | undefined {
  if (!row) return undefined;
  return (row[snake] !== undefined ? row[snake] : row[camel]) as T | undefined;
}

export function isOpenWish(row: WishRow | null | undefined): boolean {
  return Boolean(row)
    && field(row, 'post_type', 'postType') === 'wish'
    && field(row, 'status', 'status') === 'open';
}

export function formatWishTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(ms)) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

export function mapWishRow(row: WishRow | null | undefined): WishViewModel {
  const area = field<string>(row, 'impact_area', 'impactArea');
  return {
    id: field(row, 'id', 'id'),
    type: field(row, 'wish_type', 'wishType') || 'Open Call',
    title: field(row, 'title', 'title') || '',
    description: field(row, 'text', 'text') || '',
    author: field(row, 'author_name', 'authorName') || 'GloWe Member',
    authorEn: field(row, 'author_name_en', 'authorNameEn') || '',
    authorId:
      field(row, 'user_id', 'userId')
      || field(row, 'author_id', 'authorId')
      || '',
    location: row?.location || '',
    areas: area ? [area] : [],
    time: formatWishTime(field(row, 'created_at', 'createdAt')),
  };
}

export function filterWishes(
  list: readonly WishViewModel[] | null | undefined,
  filters: WishFilters | null | undefined,
): WishViewModel[] {
  const f = filters ?? {};
  return (list ?? []).filter((wish) => {
    if (f.type && f.type !== 'all' && wish.type !== f.type) return false;
    if (f.area && f.area !== 'all' && !wish.areas.includes(f.area)) return false;
    if (
      f.location
      && !wish.location.toLowerCase().includes(f.location.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function wishStats(list: readonly WishViewModel[] | null | undefined): {
  openWishes: number;
  impactAreas: number;
} {
  const wishes = list ?? [];
  const areas: Record<string, true> = {};
  wishes.forEach((w) => {
    w.areas.forEach((a) => {
      if (a) areas[a] = true;
    });
  });
  return { openWishes: wishes.length, impactAreas: Object.keys(areas).length };
}

export function validateWishDraft(
  draft: WishDraft | null | undefined,
): ValidationResult {
  const d = draft ?? {};
  if (!d.title || !String(d.title).trim()) {
    return { valid: false, error: 'Please describe what you need.' };
  }
  if (!d.wish_type) {
    return { valid: false, error: 'Please choose a wish type.' };
  }
  if (!d.impact_area) {
    return { valid: false, error: 'Please choose an impact area.' };
  }
  return { valid: true, error: '' };
}

export function buildWishText(draft: WishDraft | null | undefined): string {
  const d = draft ?? {};
  const parts: string[] = [];
  if (d.details) parts.push(String(d.details).trim());
  if (d.success) parts.push(`Success looks like: ${String(d.success).trim()}`);
  if (d.location) parts.push(`Location: ${String(d.location).trim()}`);
  return parts.filter(Boolean).join('\n\n');
}

export function isWishOwner(
  wish: WishViewModel | null | undefined,
  userId: string | null | undefined,
): boolean {
  return Boolean(wish && userId && wish.authorId === userId);
}

export function validateOfferDraft(
  draft: OfferDraft | null | undefined,
): ValidationResult {
  const d = draft ?? {};
  if (!d.offer_text || !String(d.offer_text).trim()) {
    return { valid: false, error: 'Please describe what you can offer.' };
  }
  if (!d.availability) {
    return { valid: false, error: 'Please choose your availability.' };
  }
  return { valid: true, error: '' };
}

export function buildOfferText(draft: OfferDraft | null | undefined): string {
  const d = draft ?? {};
  const parts: string[] = [];
  if (d.support_type) parts.push(`Offering: ${String(d.support_type).trim()}`);
  if (d.message) parts.push(String(d.message).trim());
  return parts.filter(Boolean).join('\n\n');
}
