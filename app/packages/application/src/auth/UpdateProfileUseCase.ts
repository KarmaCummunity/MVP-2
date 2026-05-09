/** FR-PROFILE-007: Edit Profile orchestrator. Validates inputs, then issues
 *  the minimum set of UPDATE calls (avoiding pointless writes when nothing
 *  changed). Atomicity across the three writes is best-effort — see TD-40 /
 *  P2.4 for the eventual single-statement `update()` consolidation. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface UpdateProfileInput {
  readonly userId: string;
  readonly displayName?: string;
  readonly city?: string;
  readonly cityName?: string;
  readonly biography?: string | null;
  readonly avatarUrl?: string | null;
}

/** FR-PROFILE-007 AC3 — anti-spam URL filter on bio. Conservative pattern
 *  (matches `http(s)://…` and bare-domain shapes containing a dot+TLD). */
const URL_RE = /(https?:\/\/|www\.|[\w.-]+\.[a-z]{2,})/i;

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<void> {
    if (!input.userId.trim()) throw new Error('invalid_user_id');

    if (input.displayName !== undefined) {
      const name = input.displayName.trim();
      if (name.length === 0 || name.length > 50) throw new Error('invalid_display_name');
    }

    if (input.biography !== undefined && input.biography !== null) {
      if (input.biography.length > 200) throw new Error('biography_too_long');
      if (URL_RE.test(input.biography)) throw new Error('biography_url_forbidden');
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
