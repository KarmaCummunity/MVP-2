import { describe, expect, it } from 'vitest';
import { buildChatThreadRowsNewestFirst } from '../chatThreadListRows';
import type { OptimisticMessage } from '../../store/chatStore';

function msg(partial: Partial<OptimisticMessage> & Pick<OptimisticMessage, 'clientId' | 'createdAt'>): OptimisticMessage {
  return {
    messageId: partial.messageId ?? 'm1',
    chatId: partial.chatId ?? 'c1',
    senderId: partial.senderId ?? 'u1',
    kind: partial.kind ?? 'user',
    body: partial.body ?? 'hi',
    systemPayload: partial.systemPayload ?? null,
    status: partial.status ?? 'delivered',
    deliveredAt: partial.deliveredAt ?? null,
    readAt: partial.readAt ?? null,
    failed: partial.failed,
    ...partial,
  } as OptimisticMessage;
}

describe('buildChatThreadRowsNewestFirst', () => {
  it('returns only message rows when all messages share a calendar day', () => {
    const rows = buildChatThreadRowsNewestFirst([
      msg({ clientId: 'a', createdAt: '2026-07-15T12:00:00.000Z' }),
      msg({ clientId: 'b', createdAt: '2026-07-15T18:00:00.000Z' }),
    ]);
    expect(rows).toEqual([
      { rowType: 'message', message: expect.objectContaining({ clientId: 'a' }) },
      { rowType: 'message', message: expect.objectContaining({ clientId: 'b' }) },
    ]);
  });

  it('inserts a day row when consecutive messages cross a local calendar day', () => {
    const rows = buildChatThreadRowsNewestFirst([
      msg({ clientId: 'new', createdAt: '2026-07-15T12:00:00.000Z' }),
      msg({ clientId: 'old', createdAt: '2026-07-12T12:00:00.000Z' }),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.rowType).toBe('message');
    expect(rows[1]?.rowType).toBe('day');
    if (rows[1]?.rowType === 'day') {
      expect(rows[1].anchorIso).toBe('2026-07-12T12:00:00.000Z');
      expect(rows[1].rowKey.startsWith('day-')).toBe(true);
    }
    expect(rows[2]?.rowType).toBe('message');
  });
});
