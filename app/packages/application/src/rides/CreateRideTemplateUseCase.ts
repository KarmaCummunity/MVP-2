// FR-RIDE-022 — owner creates a recurring ride template.
import { RideError, validateRideTemplateDraft } from '@kc/domain';
import type { RideTemplate } from '@kc/domain';
import type { ICityRepository } from '../ports/ICityRepository';
import type {
  CreateRideTemplateInput,
  IRideTemplateRepository,
} from '../ports/IRideTemplateRepository';

export type CreateRideTemplateUseCaseInput = Omit<CreateRideTemplateInput, 'visibility'> & {
  visibility?: CreateRideTemplateInput['visibility'];
};

export class CreateRideTemplateUseCase {
  constructor(
    private readonly repo: IRideTemplateRepository,
    private readonly cities: ICityRepository,
  ) {}

  async execute(input: CreateRideTemplateUseCaseInput): Promise<RideTemplate> {
    const description = input.description?.trim() ?? null;

    validateRideTemplateDraft({
      mode: input.mode,
      originCityId: input.originCityId,
      destCityId: input.destCityId,
      originStreet: input.originStreet,
      destStreet: input.destStreet,
      weekdayMask: input.weekdayMask,
      seatsAvailable: input.seatsAvailable,
      description,
      lookaheadDays: input.lookaheadDays,
    });

    const cityList = await this.cities.listAll();
    if (!cityList.some((c) => c.cityId === input.originCityId)) {
      throw new RideError('city_not_found', 'origin city_not_found');
    }
    if (!cityList.some((c) => c.cityId === input.destCityId)) {
      throw new RideError('city_not_found', 'dest city_not_found');
    }

    return this.repo.create({
      ...input,
      originStreet: input.originStreet.trim(),
      originStreetNumber: input.originStreetNumber?.trim() || null,
      destStreet: input.destStreet.trim(),
      destStreetNumber: input.destStreetNumber?.trim() || null,
      description,
      visibility: input.visibility ?? 'Public',
    });
  }
}
