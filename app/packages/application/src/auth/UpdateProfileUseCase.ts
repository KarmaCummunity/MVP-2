/** FR-PROFILE-007: Edit Profile orchestrator. Validates inputs, then issues
 *  the minimum set of UPDATE calls (avoiding pointless writes when nothing
 *  changed). Atomicity across the three writes is best-effort — see TD-40 /
 *  P2.4 for the eventual single-statement `update()` consolidation. */
import { BIOGRAPHY_MAX_LENGTH, containsBiographyUrl } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';

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

const STREET_NUM_RE = /^[0-9]+[A-Za-z]?$/;

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<void> {
    if (!input.userId.trim()) throw new Error('invalid_user_id');

    if (input.displayName !== undefined) {
      const name = input.displayName.trim();
      if (name.length === 0 || name.length > 50) throw new Error('invalid_display_name');
    }

    if (input.biography !== undefined && input.biography !== null) {
      if (input.biography.length > BIOGRAPHY_MAX_LENGTH) throw new Error('biography_too_long');
      if (containsBiographyUrl(input.biography)) throw new Error('biography_url_forbidden');
    }

    if (
      (input.city !== undefined && input.cityName === undefined) ||
      (input.cityName !== undefined && input.city === undefined)
    ) {
      throw new Error('city_pair_required');
    }
    if (input.city !== undefined && input.city.trim().length === 0) {
      throw new Error('invalid_city');
    }

    if (input.profileAddress !== undefined) {
      const { street, streetNumber } = input.profileAddress;
      if (street === null && streetNumber === null) {
        /* clear — valid */
      } else if (!street?.trim() || !streetNumber?.trim()) {
        throw new Error('incomplete_profile_address');
      } else {
        const s = street.trim();
        const n = streetNumber.trim();
        if (s.length < 1 || s.length > 80) throw new Error('invalid_profile_street');
        if (!STREET_NUM_RE.test(n)) throw new Error('invalid_profile_street_number');
      }
    }

    const writes: Promise<void>[] = [];
    if (
      input.displayName !== undefined &&
      input.city !== undefined &&
      input.cityName !== undefined
    ) {
      writes.push(
        this.users.setBasicInfo(input.userId, {
          displayName: input.displayName.trim(),
          city: input.city,
          cityName: input.cityName,
        }),
      );
    }
    if (input.profileAddress !== undefined) {
      writes.push(
        this.users.setProfileAddressLines(
          input.userId,
          input.profileAddress.street === null ? null : input.profileAddress.street.trim(),
          input.profileAddress.streetNumber === null ? null : input.profileAddress.streetNumber.trim(),
        ),
      );
    }
    if (input.biography !== undefined) {
      writes.push(this.users.setBiography(input.userId, input.biography));
    }
    if (input.avatarUrl !== undefined) {
      writes.push(this.users.setAvatar(input.userId, input.avatarUrl));
    }
    if (writes.length === 0) throw new Error('empty_patch');
    await Promise.all(writes);
  }
}
