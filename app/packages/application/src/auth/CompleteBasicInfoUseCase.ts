// ─────────────────────────────────────────────
// CompleteBasicInfoUseCase — FR-AUTH-010.
// Validates display_name + city, persists via IUserRepository, advances
// onboarding_state from pending_basic_info → pending_avatar.
// ─────────────────────────────────────────────

import { findCityById } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';

export interface CompleteBasicInfoInput {
  readonly userId: string;
  readonly displayName: string;
  readonly cityId: string;
}

export class CompleteBasicInfoUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CompleteBasicInfoInput): Promise<void> {
    const trimmed = input.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      throw new Error('invalid_display_name');
    }
    const city = findCityById(input.cityId);
    if (!city) {
      throw new Error('invalid_city');
    }

    await this.users.setBasicInfo(input.userId, {
      displayName: trimmed,
      city: city.cityId,
      cityName: city.nameHe,
    });
    await this.users.setOnboardingState(input.userId, 'pending_avatar');
  }
}
