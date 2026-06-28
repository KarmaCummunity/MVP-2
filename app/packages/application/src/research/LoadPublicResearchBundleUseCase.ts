/**
 * LoadPublicResearchBundleUseCase — FR-RESEARCH-001.
 * Loads a public research bundle by slug.
 * No auth required — bundle is publicly accessible.
 */

import { PublicResearchError } from '@kc/domain';
import type { PublicResearchBundle } from '@kc/domain';
import type { IPublicResearchRepository } from '../ports/IPublicResearchRepository';

export class LoadPublicResearchBundleUseCase {
  constructor(private readonly repo: IPublicResearchRepository) {}

  async execute(slug: string): Promise<PublicResearchBundle> {
    let bundle: PublicResearchBundle;
    try {
      bundle = await this.repo.loadBundle(slug);
    } catch (err) {
      if (err instanceof PublicResearchError) throw err;
      throw new PublicResearchError('network', undefined, { cause: err });
    }

    // Repo implementations should throw PublicResearchError('survey_not_found'),
    // but guard here in case an adapter returns a null-like value.
    if (bundle == null) {
      throw new PublicResearchError('survey_not_found');
    }

    return bundle;
  }
}
