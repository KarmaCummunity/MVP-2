// UpdateNotificationPreferencesUseCase — P1.5
// Mapped to: FR-NOTIF-014, FR-SETTINGS-005.
// Atomically merges notification preference toggles; unmentioned keys are preserved.

import type { IUserRepository } from '../ports/IUserRepository';
import type { NotificationPreferences } from '@kc/domain';

export class UpdateNotificationPreferencesUseCase {
  constructor(
    private readonly userRepo: Pick<IUserRepository, 'updateNotificationPreferences'>,
  ) {}

  execute(input: {
    userId: string;
    critical?: boolean;
    social?: boolean;
  }): Promise<NotificationPreferences> {
    const partial: { critical?: boolean; social?: boolean } = {};
    if (input.critical !== undefined) partial.critical = input.critical;
    if (input.social !== undefined) partial.social = input.social;
    return this.userRepo.updateNotificationPreferences(input.userId, partial);
  }
}
