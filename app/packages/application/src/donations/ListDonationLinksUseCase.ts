import type { DonationCategorySlug, DonationLink } from '@kc/domain';
import type { IDonationLinksRepository } from '../ports/IDonationLinksRepository';

export class ListDonationLinksUseCase {
  constructor(private readonly repo: IDonationLinksRepository) {}

  execute(slug: DonationCategorySlug): Promise<DonationLink[]> {
    return this.repo.listByCategory(slug);
  }
}
