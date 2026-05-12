import { describe, it, expect } from 'vitest';
import { LookupAuditUseCase } from '../LookupAuditUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';
import type { AuditEvent } from '@kc/domain';

describe('LookupAuditUseCase', () => {
  it('returns repo result and forwards explicit limit', async () => {
    const repo = new FakeModerationAdminRepository();
    const events: readonly AuditEvent[] = [
      {
        eventId: 'e_1',
        actorId: 'u_admin',
        action: 'ban_user',
        targetType: 'user',
        targetId: 'u_target',
        metadata: {},
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    repo.auditLookupResult = events;
    const uc = new LookupAuditUseCase(repo);

    const result = await uc.execute({ userId: 'u_target', limit: 50 });

    expect(result).toEqual(events);
    expect(repo.auditLookupCalls).toEqual([{ userId: 'u_target', limit: 50 }]);
  });

  it('defaults limit to 200 when not provided', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new LookupAuditUseCase(repo);

    await uc.execute({ userId: 'u_target' });

    expect(repo.auditLookupCalls).toEqual([{ userId: 'u_target', limit: 200 }]);
  });
});
