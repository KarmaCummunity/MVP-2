import { SurveyError } from '@kc/domain';
import type { SurveyBundle } from '@kc/domain';
import type { ISurveyRepository } from '../ports/ISurveyRepository';

export interface LoadSurveyBundleInput {
  readonly slug: string;
}

export class LoadSurveyBundleUseCase {
  constructor(private readonly repo: ISurveyRepository) {}

  async execute(input: LoadSurveyBundleInput): Promise<SurveyBundle> {
    let bundle: SurveyBundle;
    try {
      bundle = await this.repo.getBundle(input.slug);
    } catch (err) {
      if (err instanceof SurveyError) throw err;
      throw new SurveyError('network', undefined, { cause: err });
    }

    // Repo implementations should throw SurveyError('not_found') directly,
    // but guard here in case an adapter returns a null-like value.
    if (bundle == null) {
      throw new SurveyError('not_found');
    }

    return bundle;
  }
}
