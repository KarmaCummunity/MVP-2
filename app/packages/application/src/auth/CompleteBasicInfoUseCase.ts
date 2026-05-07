/** FR-AUTH-010: Validate display_name + city; advance onboarding_state pending_basic_info → pending_avatar.
 *  City id+name come from the caller (CityPicker queries public.cities); DB FK is the final guard. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface CompleteBasicInfoInput {
  readonly userId: string;
  readonly displayName: string;
  readonly cityId: string;
  readonly cityName: string;
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

    await this.users.setBasicInfo(input.userId, {
      displayName: trimmedName,
      city: trimmedCityId,
      cityName: trimmedCityName,
    });
    await this.users.setOnboardingState(input.userId, 'pending_avatar');
  }
}
