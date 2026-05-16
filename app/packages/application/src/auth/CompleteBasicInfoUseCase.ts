/** FR-AUTH-010: Validate display_name + city; optional profile street/number (FR-PROFILE-007 shape);
 *  advance onboarding_state pending_basic_info → pending_avatar.
 *  City id+name come from the caller (CityPicker); DB FK is the final guard. */
import { STREET_NUMBER_PATTERN } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { OnboardingError } from './errors';

export interface CompleteBasicInfoInput {
  readonly userId: string;
  readonly displayName: string;
  readonly cityId: string;
  readonly cityName: string;
  /** Optional; both trimmed non-empty required to persist (same rules as UpdateProfileUseCase). */
  readonly profileStreet?: string;
  readonly profileStreetNumber?: string;
}

export class CompleteBasicInfoUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CompleteBasicInfoInput): Promise<void> {
    const trimmedName = input.displayName.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      throw new Error('invalid_display_name');
    }
    const trimmedCityId = input.cityId.trim();
    const trimmedCityName = input.cityName.trim();
    if (trimmedCityId.length === 0 || trimmedCityName.length === 0) {
      throw new Error('invalid_city');
    }

    const st = (input.profileStreet ?? '').trim();
    const num = (input.profileStreetNumber ?? '').trim();
    if (st.length > 0 !== num.length > 0) {
      throw new Error('incomplete_profile_address');
    }
    if (st.length > 0) {
      if (st.length < 1 || st.length > 80) throw new Error('invalid_profile_street');
      if (!STREET_NUMBER_PATTERN.test(num)) throw new Error('invalid_profile_street_number');
    }

    // Audit §17.3 — reject illegal onboarding state transitions. Allowed
    // source states: pending_basic_info (normal flow) and pending_avatar
    // (idempotent re-run from the same step). 'completed' would be a
    // rollback and is rejected.
    const { state } = await this.users.getOnboardingBootstrap(input.userId);
    if (state === 'completed') {
      throw new OnboardingError(
        'illegal_transition',
        `cannot rerun basic info from state '${state}'`,
      );
    }

    await this.users.setBasicInfo(input.userId, {
      displayName: trimmedName,
      city: trimmedCityId,
      cityName: trimmedCityName,
    });
    if (st.length > 0 && num.length > 0) {
      await this.users.setProfileAddressLines(input.userId, st, num);
    } else {
      await this.users.setProfileAddressLines(input.userId, null, null);
    }
    await this.users.setOnboardingState(input.userId, 'pending_avatar');
  }
}
