// AuditEvent — append-only moderation/admin trail.
// Mapped to SRS: FR-MOD-012, FR-ADMIN-005.

export type AuditAction =
  | 'block_user'
  | 'unblock_user'
  | 'report_target'
  | 'auto_remove_target'
  | 'manual_remove_target'
  | 'restore_target'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'ban_user'
  | 'false_report_sanction_applied'
  | 'dismiss_report'
  | 'confirm_report'
  | 'delete_message';

export type AuditTargetType = 'post' | 'user' | 'chat' | 'report' | 'none';

export interface AuditEvent {
  readonly eventId: string;
  readonly actorId: string | null;
  readonly action: AuditAction;
  readonly targetType: AuditTargetType | null;
  readonly targetId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string; // ISO timestamp
}
