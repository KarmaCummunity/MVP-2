// FR-DONATE-006..009 — donation categories + community-curated NGO links.
// Persisted in `donation_categories` + `donation_links` (migration 0014).
import type { DonationCategorySlug } from './value-objects';

export interface DonationCategory {
  readonly slug: DonationCategorySlug;
  readonly labelHe: string;
  readonly iconName: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface DonationLink {
  readonly id: string;
  readonly categorySlug: DonationCategorySlug;
  readonly url: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly submittedBy: string;
  readonly validatedAt: string;
  readonly hiddenAt: string | null;
  readonly createdAt: string;
}
