import type { DonationLink, DonationCategorySlug } from '@kc/domain';

export interface AddDonationLinkInput {
  readonly categorySlug: DonationCategorySlug;
  readonly url: string;
  readonly displayName: string;
  readonly description?: string | null;
}

export interface IDonationLinksRepository {
  /** Visible (non-hidden) rows for a category, newest first. */
  listByCategory(slug: DonationCategorySlug): Promise<DonationLink[]>;

  /** Calls the validate-donation-link Edge Function. The function performs URL
   *  reachability checks and inserts via service-role on success. */
  addViaEdgeFunction(input: AddDonationLinkInput): Promise<DonationLink>;

  /** Soft-hide a link (sets hidden_at + hidden_by). Authorization (own-row or
   *  super-admin) is enforced by RLS — repository simply UPDATEs and trusts
   *  the policy to reject unauthorized writers. */
  softHide(linkId: string): Promise<void>;
}
