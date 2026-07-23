import { describe, expect, it } from 'vitest';

import type { GloweChatRow, GloweMessageRow } from '../ports/IGloweChatGateway';
import {
  attachPreviews,
  attachUnread,
  buildFirstMessage,
  formatChatTime,
  inboxRows,
  mapChatRow,
  mapMessageRows,
  validateMessageDraft,
  type InboxChat,
} from '../helpers/messageHelpers';

const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';

describe('mapChatRow / inboxRows', () => {
  it('resolves the counterpart and per-viewer hide flag', () => {
    const row = {
      chat_id: 'c1',
      participant_a: ME,
      participant_b: OTHER,
      last_message_at: '2026-07-01T10:00:00Z',
      inbox_hidden_at_a: null,
      inbox_hidden_at_b: '2026-07-01T09:00:00Z',
    };
    const mine = mapChatRow(row, ME);
    expect(mine.otherId).toBe(OTHER);
    expect(mine.hiddenForMe).toBe(false);
    const theirs = mapChatRow(row, OTHER);
    expect(theirs.otherId).toBe(ME);
    expect(theirs.hiddenForMe).toBe(true);
  });

  it('filters hidden + support chats and dedupes by counterpart', () => {
    const rows: GloweChatRow[] = [
      {
        chat_id: 'c1',
        participant_a: ME,
        participant_b: OTHER,
        last_message_at: '2026-07-02',
      },
      {
        chat_id: 'c2',
        participant_a: ME,
        participant_b: OTHER,
        last_message_at: '2026-07-01',
      },
      {
        chat_id: 'c3',
        participant_a: ME,
        participant_b: 'cccccccc-0000-0000-0000-000000000003',
        last_message_at: null,
        is_support_thread: true,
      },
      {
        chat_id: 'c4',
        participant_a: ME,
        participant_b: 'dddddddd-0000-0000-0000-000000000004',
        last_message_at: null,
        inbox_hidden_at_a: '2026-07-01',
      },
    ];
    const inbox = inboxRows(rows, ME);
    expect(inbox.map((chat) => chat.chatId)).toEqual(['c1']);
  });

  it('handles a deleted counterpart (null participant)', () => {
    const inbox = inboxRows(
      [{ chat_id: 'c9', participant_a: '', participant_b: ME, last_message_at: null }],
      ME,
    );
    expect(inbox).toHaveLength(0);
  });
});

describe('attachPreviews / attachUnread', () => {
  const chats: InboxChat[] = [
    {
      chatId: 'c1',
      otherId: OTHER,
      lastMessageAt: '2026-07-02',
      isSupport: false,
      hiddenForMe: false,
      previewText: '',
      previewAt: '2026-07-02',
      unread: 0,
    },
    {
      chatId: 'c2',
      otherId: 'cccccccc-0000-0000-0000-000000000003',
      lastMessageAt: '2026-07-01',
      isSupport: false,
      hiddenForMe: false,
      previewText: '',
      previewAt: '2026-07-01',
      unread: 0,
    },
  ];

  it('takes the newest message per chat as the preview', () => {
    const messages = [
      { chat_id: 'c1', body: 'newest', created_at: '2026-07-02T10:00' },
      { chat_id: 'c1', body: 'older', created_at: '2026-07-01T10:00' },
    ];
    const out = attachPreviews(chats, messages);
    expect(out[0].previewText).toBe('newest');
    expect(out[1].previewText).toBe('');
  });

  it('attaches unread counts, defaulting to zero', () => {
    const out = attachUnread(chats, [{ chat_id: 'c2', unread_count: 3 }]);
    expect(out[0].unread).toBe(0);
    expect(out[1].unread).toBe(3);
  });
});

describe('buildFirstMessage', () => {
  it('carries the need title before the offer text', () => {
    const msg = buildFirstMessage(
      'need',
      'מחפשים מתנדבים לחלוקת מזון',
      'אני יכול לעזור ביום שלישי',
    );
    expect(msg.startsWith('Re: מחפשים מתנדבים לחלוקת מזון')).toBe(true);
    expect(msg).toContain('אני יכול לעזור ביום שלישי');
  });

  it('caps the seeded message at the 2000-char KC body limit', () => {
    const msg = buildFirstMessage('need', 'כותרת', 'x'.repeat(3000));
    expect(msg.length).toBeLessThanOrEqual(2000);
  });
});

describe('mapMessageRows', () => {
  it('marks mine vs theirs and system messages', () => {
    const rows: GloweMessageRow[] = [
      {
        message_id: 'm1',
        chat_id: 'c1',
        sender_id: ME,
        kind: 'user',
        body: 'שלום',
        created_at: '2026-07-01',
      },
      {
        message_id: 'm2',
        chat_id: 'c1',
        sender_id: OTHER,
        kind: 'user',
        body: 'היי',
        created_at: '2026-07-01',
      },
      {
        message_id: 'm3',
        chat_id: 'c1',
        sender_id: '',
        kind: 'system',
        body: '',
        created_at: '2026-07-01',
      },
    ];
    const out = mapMessageRows(rows, ME);
    expect(out[0].mine).toBe(true);
    expect(out[1].mine).toBe(false);
    expect(out[2].isSystem).toBe(true);
    expect(out[2].text).toBe('');
  });
});

describe('validateMessageDraft', () => {
  it('requires non-blank text within 2000 chars', () => {
    expect(validateMessageDraft('שלום').valid).toBe(true);
    expect(validateMessageDraft('   ').valid).toBe(false);
    expect(validateMessageDraft('x'.repeat(2001)).valid).toBe(false);
  });
});

describe('formatChatTime', () => {
  it('is empty for missing or invalid values', () => {
    expect(formatChatTime('')).toBe('');
    expect(formatChatTime('not-a-date')).toBe('');
  });

  it('shows a date for non-today values', () => {
    const now = Date.parse('2026-07-04T12:00:00Z');
    const label = formatChatTime('2026-06-01T10:00:00Z', now);
    expect(label).toBeTruthy();
  });
});
