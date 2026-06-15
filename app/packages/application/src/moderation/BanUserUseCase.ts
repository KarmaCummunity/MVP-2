/** FR-ADMIN-004 — ban a user with defence-in-depth checks. */
import { hasPermission } from '@kc/domain';
import type {
  BanReason,
  IModerationAdminRepository,
} from '../ports/IModerationAdminRepository';
import { ModerationError, ModerationForbiddenError } from './errors';

export interface BanUserInput {
  adminId: string;
  targetUserId: string;
  reason: BanReason;
  note: string;
}

export class BanUserUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: BanUserInput): Promise<void> {
    // Defence-in-depth (FR-ADMIN-006): the DB `admin_ban_user` RPC is
    // super_admin-only, but enforce the same PERMISSION_MATRIX rule here so an
    // unauthorized caller fails fast with a typed error instead of an opaque
    // 42501. A permanent ban requires `reports.permanent_ban` (super_admin).
    const roles = await this.repo.getMyRoles();
    if (!hasPermission(roles, 'reports.permanent_ban')) {
      throw new ModerationForbiddenError();
    }
    if (input.adminId === input.targetUserId) {
      throw new ModerationError('cannot_ban_self', 'cannot ban self');
    }
    if (await this.repo.isUserAdmin(input.targetUserId)) {
      throw new ModerationError('cannot_ban_admin', 'target is super admin');
    }
    await this.repo.banUser(input.targetUserId, input.reason, input.note);
  }
}
