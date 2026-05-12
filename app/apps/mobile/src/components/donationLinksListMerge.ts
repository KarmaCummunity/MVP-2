// FR-DONATE-007/009 — keep local donation link arrays free of duplicate ids (defensive UI state).
import type { DonationLink } from '@kc/domain';

export function dedupeDonationLinksById(links: readonly DonationLink[]): DonationLink[] {
  const seen = new Set<string>();
  const out: DonationLink[] = [];
  for (const link of links) {
    if (seen.has(link.id)) continue;
    seen.add(link.id);
    out.push(link);
  }
  return out;
}
