import type {
  IModerationAdminRepository,
  ModerationTargetType,
  BanReason,
} from '../../ports/IModerationAdminRepository';
import type { AuditEvent } from '@kc/domain';

export class FakeModerationAdminRepository implements IModerationAdminRepository {
  public restoreCalls: Array<{ targetType: ModerationTargetType; targetId: string }> = [];
  public dismissCalls: string[] = [];
  public confirmCalls: string[] = [];
  public banCalls: Array<{ userId: string; reason: BanReason; note: string }> = [];
  public deleteMessageCalls: string[] = [];
  public auditLookupCalls: Array<{ userId: string; limit?: number }> = [];
  public auditLookupResult: readonly AuditEvent[] = [];
  public adminIds: Set<string> = new Set();
  public errorOnNext: Error | null = null;

  private maybeThrow() {
    if (this.errorOnNext) {
      const e = this.errorOnNext;
      this.errorOnNext = null;
      throw e;
    }
  }

  async restoreTarget(targetType: ModerationTargetType, targetId: string) {
    this.maybeThrow();
    this.restoreCalls.push({ targetType, targetId });
  }
  async dismissReport(reportId: string) {
    this.maybeThrow();
    this.dismissCalls.push(reportId);
  }
  async confirmReport(reportId: string) {
    this.maybeThrow();
    this.confirmCalls.push(reportId);
  }
  async banUser(userId: string, reason: BanReason, note: string) {
    this.maybeThrow();
    this.banCalls.push({ userId, reason, note });
  }
  async deleteMessage(messageId: string) {
    this.maybeThrow();
    this.deleteMessageCalls.push(messageId);
  }
  async auditLookup(userId: string, limit?: number) {
    this.maybeThrow();
    this.auditLookupCalls.push({ userId, limit });
    return this.auditLookupResult;
  }
  async isUserAdmin(userId: string) {
    this.maybeThrow();
    return this.adminIds.has(userId);
  }
}
