/** FR-ADMIN-004 — ban a user with defence-in-depth checks. */
import type {
  BanReason,
  IModerationAdminRepository,
} from '../ports/IModerationAdminRepository';
import { ModerationError } from './errors';

export interface BanUserInput {
  adminId: string;
  targetUserId: string;
  reason: BanReason;
  note: string;
}

export class BanUserUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: BanUserInput): Promise<void> {
    if (input.adminId === input.targetUserId) {
      throw new ModerationError('cannot_ban_self', 'cannot ban self');
    }
    if (await this.repo.isUserAdmin(input.targetUserId)) {
      throw new ModerationError('cannot_ban_admin', 'target is super admin');
    }
    await this.repo.banUser(input.targetUserId, input.reason, input.note);
  }
}
