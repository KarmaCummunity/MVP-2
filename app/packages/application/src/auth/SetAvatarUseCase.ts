/** FR-AUTH-011 AC4 + AC5: persist the user's profile photo URL.
 *  Pass `null` to clear an SSO-prefilled or previously-uploaded avatar.
 *  The actual upload (image pick + resize + Storage put) lives in the FE service —
 *  this use-case only validates and persists the resulting URL.
 *  Reused by FR-PROFILE-007 Edit Profile flow when it ships. */
import type { IAuthService } from '../ports/IAuthService';
import type { IUserRepository } from '../ports/IUserRepository';
import { assertSessionUser } from './assertSessionUser';

export interface SetAvatarInput {
  readonly sessionUserId: string;
  readonly userId: string;
  readonly avatarUrl: string | null;
}

export class SetAvatarUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly auth: IAuthService,
  ) {}

  async execute(input: SetAvatarInput): Promise<void> {
    assertSessionUser(input.sessionUserId, input.userId);
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
      await this.auth.syncProfileMetadata({ avatarUrl: url });
      return;
    }
    await this.users.setAvatar(input.userId, null);
    await this.auth.syncProfileMetadata({ avatarUrl: null });
  }
}
