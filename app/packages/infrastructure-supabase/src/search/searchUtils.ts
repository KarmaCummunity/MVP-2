import type { DonationCategorySlug } from '@kc/domain';
import { CATEGORY_HE_TO_SLUG } from './searchConstants';
export function escapeIlike(q: string): string { return q.replace(/[%_\\]/g, (c) => `\\${c}`); }
export function findMatchingCategorySlug(lowerQuery: string): DonationCategorySlug | null {
  for (const [label, slug] of Object.entries(CATEGORY_HE_TO_SLUG)) { if (lowerQuery.includes(label)) return slug; }
  return null;
}
