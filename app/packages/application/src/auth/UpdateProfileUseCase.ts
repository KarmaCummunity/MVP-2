/** FR-PROFILE-007: Edit Profile orchestrator. Validates inputs, then issues
 *  a single atomic `UPDATE users SET ...` (audit §3.5 — was Promise.all of
 *  four independent writes). Typed `ProfileError` codes per audit §3.6. */
import { BIOGRAPHY_MAX_LENGTH, STREET_NUMBER_PATTERN, containsBiographyUrl } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';
import { ProfileError } from './errors';

export interface UpdateProfileInput {
  readonly userId: string;
  readonly displayName?: string;
  readonly city?: string;
  readonly cityName?: string;
  /** When present, persists or clears (`{ street: null, streetNumber: null }`) profile address lines. */
  readonly profileAddress?: { readonly street: string | null; readonly streetNumber: string | null };
  readonly biography?: string | null;
  readonly avatarUrl?: string | null;
}

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<void> {
    if (!input.userId.trim()) throw new ProfileError('invalid_user_id');

    if (input.displayName !== undefined) {
      const name = input.displayName.trim();
      if (name.length === 0 || name.length > 50) throw new ProfileError('invalid_display_name');
    }

    if (input.biography !== undefined && input.biography !== null) {
      if (input.biography.length > BIOGRAPHY_MAX_LENGTH) throw new ProfileError('biography_too_long');
      if (containsBiographyUrl(input.biography)) throw new ProfileError('biography_url_forbidden');
    }

    if (
      (input.city !== undefined && input.cityName === undefined) ||
      (input.cityName !== undefined && input.city === undefined)
    ) {
      throw new ProfileError('city_pair_required');
    }
    if (input.city !== undefined && input.city.trim().length === 0) {
      throw new ProfileError('invalid_city');
    }

    let normalizedStreet: string | null | undefined;
    let normalizedNumber: string | null | undefined;
    if (input.profileAddress !== undefined) {
      const { street, streetNumber } = input.profileAddress;
      if (street === null && streetNumber === null) {
        normalizedStreet = null;
        normalizedNumber = null;
      } else if (!street?.trim() || !streetNumber?.trim()) {
        throw new ProfileError('incomplete_profile_address');
      } else {
        const s = street.trim();
        const n = streetNumber.trim();
        if (s.length < 1 || s.length > 80) throw new ProfileError('invalid_profile_street');
        if (!STREET_NUMBER_PATTERN.test(n)) throw new ProfileError('invalid_profile_street_number');
        normalizedStreet = s;
        normalizedNumber = n;
      }
    }

    const patch: Parameters<IUserRepository['updateEditableProfile']>[1] = {};
    if (input.displayName !== undefined) patch.displayName = input.displayName.trim();
    if (input.city !== undefined) patch.city = input.city;
    if (input.cityName !== undefined) patch.cityName = input.cityName;
    if (normalizedStreet !== undefined) patch.profileStreet = normalizedStreet;
    if (normalizedNumber !== undefined) patch.profileStreetNumber = normalizedNumber;
    if (input.biography !== undefined) patch.biography = input.biography;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;

    if (Object.keys(patch).length === 0) throw new ProfileError('empty_patch');
    await this.users.updateEditableProfile(input.userId, patch);
  }
}
