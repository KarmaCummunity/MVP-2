/** FR-AUTH-011 AC4 + AC5: persist the user's profile photo URL.
 *  Pass `null` to clear an SSO-prefilled or previously-uploaded avatar.
 *  The actual upload (image pick + resize + Storage put) lives in the FE service —
 *  this use-case only validates and persists the resulting URL.
 *  Reused by FR-PROFILE-007 Edit Profile flow when it ships. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface SetAvatarInput {
  readonly userId: string;
  readonly avatarUrl: string | null;
}

export class SetAvatarUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: SetAvatarInput): Promise<void> {
    if (!input.userId.trim()) {
      throw new Error('invalid_user_id');
    }
    if (input.avatarUrl !== null) {
      const url = input.avatarUrl.trim();
      if (url.length === 0) {
        throw new Error('invalid_avatar_url');
      }
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('invalid_avatar_url');
      }
      await this.users.setAvatar(input.userId, url);
      return;
    }
    await this.users.setAvatar(input.userId, null);
  }
}
