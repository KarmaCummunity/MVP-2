import type { DonationCategorySlug } from '@kc/domain';
import { CATEGORY_HE_TO_SLUG } from './searchConstants';
export function escapeIlike(q: string): string { return q.replace(/[%_\\]/g, (c) => `\\${c}`); }
// Build a PostgREST `.or()`-safe ilike value: escape ILIKE wildcards, then wrap
// in double quotes (escaping `"` and `\`) so structural chars (`,` `.` `:` `()`)
// in user input stay literal and cannot inject extra OR predicates (CWE-943).
export function quoteOrValue(q: string): string {
  const quoted = escapeIlike(q).replace(/[\\"]/g, (c) => `\\${c}`);
  return `"%${quoted}%"`;
}
export function findMatchingCategorySlug(lowerQuery: string): DonationCategorySlug | null {
  for (const [label, slug] of Object.entries(CATEGORY_HE_TO_SLUG)) { if (lowerQuery.includes(label)) return slug; }
  return null;
}
