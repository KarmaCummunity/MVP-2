import { generateRideTitle, validateRideDraft, RideError } from '@kc/domain';
import type { ICityRepository } from '../ports/ICityRepository';
import type { CreateRideListingRepoInput, IRideListingRepository, RideListingRow } from '../ports/IRideListingRepository';
import type { RideMode } from '@kc/domain';

export interface CreateRideListingInput {
  ownerId: string;
  mode: RideMode;
  originCityId: string;
  destCityId: string;
  originStreet: string;
  originStreetNumber: string | null;
  destStreet: string;
  destStreetNumber: string | null;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
}

export class CreateRideListingUseCase {
  constructor(
    private readonly repo: IRideListingRepository,
    private readonly cities: ICityRepository,
  ) {}

  async execute(input: CreateRideListingInput): Promise<RideListingRow> {
    const description = input.description?.trim() ?? null;
    if (description && description.length > 500) {
      throw new RideError('description_too_long', 'description exceeds 500 characters');
    }

    validateRideDraft({
      mode: input.mode,
      originCityId: input.originCityId,
      destCityId: input.destCityId,
      originStreet: input.originStreet,
      destStreet: input.destStreet,
      departsAt: input.departsAt,
      seatsAvailable: input.seatsAvailable,
      description,
    });

    const cityList = await this.cities.listAll();
    const origin = cityList.find((c) => c.cityId === input.originCityId);
    const dest = cityList.find((c) => c.cityId === input.destCityId);
    if (!origin || !dest) {
      throw new RideError('city_not_found', 'city_not_found');
    }

    const title = generateRideTitle({
      originCityName: origin.nameHe,
      destCityName: dest.nameHe,
      departsAt: new Date(input.departsAt),
    });

    const payload: CreateRideListingRepoInput = {
      ownerId: input.ownerId,
      mode: input.mode,
      originCityId: input.originCityId,
      destCityId: input.destCityId,
      originStreet: input.originStreet.trim(),
      originStreetNumber: input.originStreetNumber?.trim() || null,
      destStreet: input.destStreet.trim(),
      destStreetNumber: input.destStreetNumber?.trim() || null,
      departsAt: input.departsAt,
      seatsAvailable: input.seatsAvailable,
      description,
      title,
      visibility: 'Public',
    };

    return this.repo.create(payload);
  }
}
