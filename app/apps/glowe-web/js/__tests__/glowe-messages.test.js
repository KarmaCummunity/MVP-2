import { describe, it, expect } from 'vitest';
import GloweMessages from '../glowe-messages.js';

const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';

describe('mapChatRow / inboxRows', () => {
  it('resolves the counterpart and per-viewer hide flag', () => {
    const row = {
      chat_id: 'c1', participant_a: ME, participant_b: OTHER,
      last_message_at: '2026-07-01T10:00:00Z', inbox_hidden_at_a: null, inbox_hidden_at_b: '2026-07-01T09:00:00Z'
    };
    const mine = GloweMessages.mapChatRow(row, ME);
    expect(mine.otherId).toBe(OTHER);
    expect(mine.hiddenForMe).toBe(false);
    const theirs = GloweMessages.mapChatRow(row, OTHER);
    expect(theirs.otherId).toBe(ME);
    expect(theirs.hiddenForMe).toBe(true);
  });

  it('filters hidden + support chats and dedupes by counterpart', () => {
    const rows = [
      { chat_id: 'c1', participant_a: ME, participant_b: OTHER, last_message_at: '2026-07-02' },
      { chat_id: 'c2', participant_a: ME, participant_b: OTHER, last_message_at: '2026-07-01' },
      { chat_id: 'c3', participant_a: ME, participant_b: 'cccccccc-0000-0000-0000-000000000003', is_support_thread: true },
      { chat_id: 'c4', participant_a: ME, participant_b: 'dddddddd-0000-0000-0000-000000000004', inbox_hidden_at_a: '2026-07-01' }
    ];
    const inbox = GloweMessages.inboxRows(rows, ME);
    expect(inbox.map(c => c.chatId)).toEqual(['c1']);
  });

  it('handles a deleted counterpart (null participant)', () => {
    const inbox = GloweMessages.inboxRows([{ chat_id: 'c9', participant_a: null, participant_b: ME }], ME);
    expect(inbox).toHaveLength(0);
  });
});

describe('attachPreviews / attachUnread', () => {
  const chats = [{ chatId: 'c1', lastMessageAt: '2026-07-02' }, { chatId: 'c2', lastMessageAt: '2026-07-01' }];

  it('takes the newest message per chat as the preview', () => {
    const messages = [
      { chat_id: 'c1', body: 'newest', created_at: '2026-07-02T10:00' },
      { chat_id: 'c1', body: 'older', created_at: '2026-07-01T10:00' }
    ];
    const out = GloweMessages.attachPreviews(chats, messages);
    expect(out[0].previewText).toBe('newest');
    expect(out[1].previewText).toBe('');
  });

  it('attaches unread counts, defaulting to zero', () => {
    const out = GloweMessages.attachUnread(chats, [{ chat_id: 'c2', unread_count: 3 }]);
    expect(out[0].unread).toBe(0);
    expect(out[1].unread).toBe(3);
  });
});

describe('buildFirstMessage', () => {
  it('carries the need title before the offer text', () => {
    const msg = GloweMessages.buildFirstMessage('need', 'מחפשים מתנדבים לחלוקת מזון', 'אני יכול לעזור ביום שלישי');
    expect(msg.startsWith('Re: מחפשים מתנדבים לחלוקת מזון')).toBe(true);
    expect(msg).toContain('אני יכול לעזור ביום שלישי');
  });

  it('caps the seeded message at the 2000-char KC body limit', () => {
    const msg = GloweMessages.buildFirstMessage('need', 'כותרת', 'x'.repeat(3000));
    expect(msg.length).toBeLessThanOrEqual(2000);
  });
});

describe('mapMessageRows', () => {
  it('marks mine vs theirs and system messages', () => {
    const rows = [
      { message_id: 'm1', sender_id: ME, kind: 'user', body: 'שלום', created_at: '2026-07-01' },
      { message_id: 'm2', sender_id: OTHER, kind: 'user', body: 'היי', created_at: '2026-07-01' },
      { message_id: 'm3', sender_id: null, kind: 'system', body: null, created_at: '2026-07-01' }
    ];
    const out = GloweMessages.mapMessageRows(rows, ME);
    expect(out[0].mine).toBe(true);
    expect(out[1].mine).toBe(false);
    expect(out[2].isSystem).toBe(true);
    expect(out[2].text).toBe('');
  });
});

describe('validateMessageDraft', () => {
  it('requires non-blank text within 2000 chars', () => {
    expect(GloweMessages.validateMessageDraft('שלום').valid).toBe(true);
    expect(GloweMessages.validateMessageDraft('   ').valid).toBe(false);
    expect(GloweMessages.validateMessageDraft('x'.repeat(2001)).valid).toBe(false);
  });
});

describe('formatChatTime', () => {
  it('is empty for missing or invalid values', () => {
    expect(GloweMessages.formatChatTime('')).toBe('');
    expect(GloweMessages.formatChatTime('not-a-date')).toBe('');
  });

  it('shows a date for non-today values', () => {
    const now = Date.parse('2026-07-04T12:00:00Z');
    const label = GloweMessages.formatChatTime('2026-06-01T10:00:00Z', now);
    expect(label).toBeTruthy();
  });
});

describe('dayLabelForIso / groupMessagesWithDaySeparators', () => {
  const NOW = new Date(2026, 6, 19, 15, 0, 0).getTime();
  const labels = (k) => ({ today: 'Today', yesterday: 'Yesterday' }[k] || k);

  it('labels today and yesterday', () => {
    expect(GloweMessages.dayLabelForIso(new Date(2026, 6, 19, 10, 0, 0).toISOString(), NOW, labels)).toBe('Today');
    expect(GloweMessages.dayLabelForIso(new Date(2026, 6, 18, 10, 0, 0).toISOString(), NOW, labels)).toBe('Yesterday');
  });

  it('inserts day separators between messages', () => {
    const msgs = [
      { id: 'm1', text: 'a', createdAt: new Date(2026, 6, 18, 10, 0, 0).toISOString(), mine: false, isSystem: false },
      { id: 'm2', text: 'b', createdAt: new Date(2026, 6, 19, 10, 0, 0).toISOString(), mine: true, isSystem: false }
    ];
    const items = GloweMessages.groupMessagesWithDaySeparators(msgs, NOW, labels);
    expect(items.filter(i => i.type === 'day').length).toBe(2);
    expect(items.filter(i => i.type === 'msg').map(i => i.message.id)).toEqual(['m1', 'm2']);
  });
});

describe('optimistic send helpers', () => {
  const CHAT = 'cccccccc-0000-0000-0000-000000000003';

  it('creates a pending optimistic row', () => {
    const row = GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello');
    expect(row).toMatchObject({ clientId: 'client-1', pending: true, failed: false, mine: true, text: 'hello' });
  });

  it('reconciles pending with server row', () => {
    const list = [GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello')];
    const server = { message_id: 'srv-1', sender_id: ME, body: 'hello', created_at: '2026-07-19T10:00:00Z', kind: 'user' };
    const out = GloweMessages.reconcileOptimistic(list, server, 'client-1', ME);
    expect(out[0]).toMatchObject({ id: 'srv-1', pending: false, failed: false });
  });

  it('marks failed without removing the row', () => {
    const list = [GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello')];
    const out = GloweMessages.markMessageFailed(list, 'client-1');
    expect(out[0]).toMatchObject({ failed: true, pending: false });
  });
});

describe('shouldDedupeIncoming / patchInboxOnNewMessage', () => {
  it('dedupes by message_id', () => {
    const existing = [{ id: 'm1', text: 'hi' }];
    expect(GloweMessages.shouldDedupeIncoming(existing, { message_id: 'm1', body: 'hi' })).toBe(true);
    expect(GloweMessages.shouldDedupeIncoming(existing, { message_id: 'm2', body: 'yo' })).toBe(false);
  });

  it('moves chat to top and updates preview on new message', () => {
    const inbox = [
      { chatId: 'c2', otherId: OTHER, previewText: 'old', previewAt: '2026-07-18', unread: 0, lastMessageAt: '2026-07-18' },
      { chatId: 'c1', otherId: ME, previewText: 'x', previewAt: '2026-07-17', unread: 1, lastMessageAt: '2026-07-17' }
    ];
    const row = { chat_id: 'c2', sender_id: OTHER, body: 'new', created_at: '2026-07-19T12:00:00Z' };
    const out = GloweMessages.patchInboxOnNewMessage(inbox, row, ME, null);
    expect(out[0].chatId).toBe('c2');
    expect(out[0].previewText).toBe('new');
    expect(out[0].unread).toBe(1);
  });

  it('does not bump unread when that chat is open', () => {
    const inbox = [{ chatId: 'c1', otherId: OTHER, previewText: 'x', previewAt: '2026-07-17', unread: 0, lastMessageAt: '2026-07-17' }];
    const row = { chat_id: 'c1', sender_id: OTHER, body: 'new', created_at: '2026-07-19T12:00:00Z' };
    const out = GloweMessages.patchInboxOnNewMessage(inbox, row, ME, 'c1');
    expect(out[0].unread).toBe(0);
  });
});
