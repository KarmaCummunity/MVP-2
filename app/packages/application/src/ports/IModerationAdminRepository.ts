import type { AuditEvent } from '@kc/domain';

export type ModerationTargetType = 'post' | 'user' | 'chat';
export type BanReason = 'spam' | 'harassment' | 'policy_violation' | 'other';

export interface IModerationAdminRepository {
  restoreTarget(targetType: ModerationTargetType, targetId: string): Promise<void>;
  dismissReport(reportId: string): Promise<void>;
  confirmReport(reportId: string): Promise<void>;
  banUser(userId: string, reason: BanReason, note: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  auditLookup(userId: string, limit?: number): Promise<readonly AuditEvent[]>;
  /** True if the target user has the super-admin flag set. Defence-in-depth check
   *  used by BanUserUseCase before the DB raises P0014. */
  isUserAdmin(userId: string): Promise<boolean>;
}
