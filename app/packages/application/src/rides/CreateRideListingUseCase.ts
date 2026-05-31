import { generateRideTitle, validateRideDraft, RideError } from '@kc/domain';
import type {
  RideCargoSpec,
  RideFoodSpec,
  RideMode,
  RidePaymentSpec,
  RideRequirementsSpec,
} from '@kc/domain';
import type { ICityRepository } from '../ports/ICityRepository';
import type {
  CreateRideListingRepoInput,
  IRideListingRepository,
  RideListingRow,
  RideVisibility,
} from '../ports/IRideListingRepository';

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
  /** Defaults to 'Public' for backwards compatibility with the V2.0 surface. */
  visibility?: RideVisibility;
  // FR-RIDE-026..029 — optional advanced specs.
  cargo?: RideCargoSpec;
  food?: RideFoodSpec;
  payment?: RidePaymentSpec;
  requirements?: RideRequirementsSpec;
  /** FR-RIDE-044 — when set, the ride is linked to an items post (mode='request' only). */
  linkedPostId?: string | null;
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

    // FR-RIDE-044 — linked_post_id is only valid on request rides
    // (CHECK constraint enforces server-side; fail fast in domain too).
    if (input.linkedPostId && input.mode !== 'request') {
      throw new RideError('seats_forbidden', 'linked_post_id requires mode=request');
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
      cargo: input.cargo,
      food: input.food,
      payment: input.payment,
      requirements: input.requirements,
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
      visibility: input.visibility ?? 'Public',
      // FR-RIDE-026..029 — pass advanced fields through verbatim; the adapter
      // applies CHECK-friendly NULL-or-set discipline based on the enabled flags.
      cargoEnabled: input.cargo?.enabled ?? false,
      cargoMaxVolumeL: input.cargo?.enabled ? input.cargo.maxVolumeL : null,
      cargoMaxWeightKg: input.cargo?.enabled ? input.cargo.maxWeightKg : null,
      cargoAllowedTypes: input.cargo?.enabled ? input.cargo.allowedTypes : null,
      foodShippingEnabled: input.food?.enabled ?? false,
      foodMaxKg: input.food?.enabled ? input.food.maxKg : null,
      foodChilled: input.food?.enabled ? input.food.chilled : null,
      paymentModel: input.payment?.model ?? 'free',
      paymentAmountIls:
        input.payment?.model === 'expense_share' ? input.payment.amountIls : null,
      reqGender: input.requirements?.gender ?? 'any',
      reqSmokingAllowed: input.requirements?.smokingAllowed ?? false,
      reqPetsAllowed: input.requirements?.petsAllowed ?? false,
      reqVerifiedOnly: input.requirements?.verifiedOnly ?? false,
      linkedPostId: input.linkedPostId ?? null,
    };

    return this.repo.create(payload);
  }
}
